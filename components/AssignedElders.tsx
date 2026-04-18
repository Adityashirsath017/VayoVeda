import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, db } from "../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFocusEffect } from "expo-router";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AssignedElders() {
  const router = useRouter();
  // Local state for displaying assigned elders (if needed)
  const [elders, setElders] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);
  const [confirmRemoveElder, setConfirmRemoveElder] = useState<any>(null);
  
  const [searchEmail, setSearchEmail] = useState("");
  const [foundElder, setFoundElder] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchElders = async () => {
    try {
      const caretakerEmail = await AsyncStorage.getItem("userEmail");
      if (!caretakerEmail) return;

      const usersRef = collection(db, "users");
      const caretakerQuery = query(usersRef, where("email", "==", caretakerEmail));
      const caretakerSnapshot = await getDocs(caretakerQuery);

      if (!caretakerSnapshot.empty) {
        const caretakerData = caretakerSnapshot.docs[0].data();
        const elderIds = caretakerData.elders || [];

        console.log("=== FETCH ELDERS DEBUG ===");
        console.log("Caretaker elders array from DB:", elderIds);

        if (elderIds.length > 0) {
          const eldersData: any[] = [];

          for (const elderId of elderIds) {
            console.log("Processing elder ID:", elderId);
            
            const elderQuery = query(usersRef, where("uid", "==", elderId));
            const eSnap = await getDocs(elderQuery);
            let eData: any = null;
            if (!eSnap.empty) {
              eData = eSnap.docs[0].data();
            } else {
              // Try to fetch by document ID
              const allUsersSnap = await getDocs(collection(db, "users"));
              allUsersSnap.forEach((doc) => {
                if (doc.id === elderId) {
                  eData = doc.data();
                }
              });
            }

            if (eData) {
              console.log("Found elder data for", elderId, ":", eData.email);

              // Calculate Age from DOB if not explicitly stored
              let calculatedAge = "N/A";
              if (eData.age) {
                calculatedAge = eData.age;
              } else if (eData.dob) {
                const parts = eData.dob.includes("/") ? eData.dob.split('/') : eData.dob.split('-');
                if (parts.length === 3) {
                  // If DD/MM/YYYY
                  const dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  if (!isNaN(dobDate.getTime())) {
                    const diffMs = Date.now() - dobDate.getTime();
                    const ageDt = new Date(diffMs);
                    calculatedAge = Math.abs(ageDt.getUTCFullYear() - 1970).toString();
                  }
                }
              }

              eldersData.push({
                id: elderId,
                email: eData.email || "",
                name: `${eData.firstName || eData.name || "Unknown"} ${eData.surname || ""}`.trim(),
                age: calculatedAge,
                health: eData.health || "Good",
                vitals: {
                  bp: eData.vitals?.bp || "120/80",
                  sugar: eData.vitals?.sugar || "90",
                },
                tasks: eData.tasks || []
              });
            } else {
              console.warn("Could not find elder data for ID:", elderId);
            }
          }
          console.log("Final elders list count:", eldersData.length);
          setElders(eldersData);
        } else {
          setElders([]);
        }
      }
    } catch (error) {
      console.error("Error fetching assigned elders:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("AssignedElders component focused - fetching elders");
      fetchElders();
    }, [])
  );

  const verifyElder = async () => {
    if (!searchEmail.trim()) {
      showAlert("Error", "Please enter an email address.");
      return;
    }
    setIsSearching(true);
    setFoundElder(null);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", searchEmail.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        showAlert("Not Found", "No registered elder found with this email ID. You can only add registered elders.");
      } else {
        const elderData = snap.docs[0].data();
        // Fallback to "elder" if role isn't explicitly set in DB (since some elders may lack the field). 
        // Just make sure it explicitly isn't a "careTaker".
        if (elderData.role && elderData.role?.toLowerCase()?.trim() !== "elder") {
            showAlert("Error", "User found but is not an Elder profile.");
        } else {
            setFoundElder({ id: snap.docs[0].id, ...elderData });
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      showAlert("Error", "Failed to search for elder.");
    } finally {
      setIsSearching(false);
    }
  };

  const addElder = async () => {
    if (foundElder) {
      try {
        const caretakerEmail = await AsyncStorage.getItem("userEmail");
        if (!caretakerEmail) {
          showAlert("Error", "Caretaker email not found.");
          return;
        }

        const usersRef = collection(db, "users");
        const caretakerQuery = query(usersRef, where("email", "==", caretakerEmail));
        const caretakerSnapshot = await getDocs(caretakerQuery);
        if (caretakerSnapshot.empty) {
          showAlert("Error", "Caretaker not found.");
          return;
        }
        const caretakerDoc = caretakerSnapshot.docs[0];
        const caretakerId = caretakerDoc.id;

        const elderQuery = query(usersRef, where("email", "==", foundElder.email));
        const elderSnapshot = await getDocs(elderQuery);
        if (!elderSnapshot.empty) {
          const elderDoc = elderSnapshot.docs[0];

          await updateDoc(caretakerDoc.ref, {
            elders: arrayUnion(elderDoc.id),
          });

          await updateDoc(elderDoc.ref, {
            caretakerAssigned: caretakerId,
          });
        }

        // Trigger refetch of elders directly from the updated database
        await fetchElders();

        setSearchEmail("");
        setFoundElder(null);
        setModalVisible(false);
        showAlert("Success", "Elder successfully verified and linked!");
      } catch (error) {
        console.error("Error adding elder:", error);
        showAlert("Error", "Failed to attach elder to your dashboard.");
      }
    }
  };

  const removeElder = async (elder: any) => {
    console.log("REMOVE ELDER FUNCTION CALLED with elder:", elder);
    console.log("Elder ID:", elder?.id);
    console.log("Elder Name:", elder?.name);
    
    // Show confirmation modal instead of Alert
    setConfirmRemoveElder(elder);
  };

  const executeRemoval = async (elder: any) => {
    console.log("REMOVE CONFIRMED - Starting removal process");
    try {
      const caretakerEmail = await AsyncStorage.getItem("userEmail");
      if (!caretakerEmail) {
        Alert.alert("Error", "Caretaker email not found.");
        setConfirmRemoveElder(null);
        return;
      }

      console.log("=== REMOVE ELDER DEBUG ===");
      console.log("Elder object:", JSON.stringify(elder));
      console.log("Elder ID:", elder.id);
      console.log("Elder Email:", elder.email);

      const usersRef = collection(db, "users");
      const caretakerQuery = query(usersRef, where("email", "==", caretakerEmail));
      const caretakerSnapshot = await getDocs(caretakerQuery);

      if (!caretakerSnapshot.empty) {
        const caretakerDoc = caretakerSnapshot.docs[0];
        const caretakerData = caretakerDoc.data();

        console.log("Current elders in DB:", caretakerData.elders);

        // 1. Remove elder from Caretaker's elders array
        console.log("Attempting to remove elder ID:", elder.id);
        await updateDoc(caretakerDoc.ref, {
          elders: arrayRemove(elder.id),
        });

        console.log("Successfully removed from caretaker array");

        // 2. Remove caretaker connection from Elder document and clear tasks/medications
        try {
          // Search by email for most reliable match
          const elderByEmailQuery = query(usersRef, where("email", "==", elder.email));
          const elderByEmailSnap = await getDocs(elderByEmailQuery);
          
          console.log("Found elder by email - docs count:", elderByEmailSnap.size);

          if (!elderByEmailSnap.empty) {
            const elderDoc = elderByEmailSnap.docs[0];
            console.log("Clearing caretaker assignment, tasks, and medications for elder");
            await updateDoc(elderDoc.ref, {
              caretakerAssigned: null,
              tasks: [],
              medications: [],
            });
            console.log("Successfully cleared caretaker assignment, tasks, and medications");
          } else {
            console.warn("Elder not found by email:", elder.email);
          }
        } catch (elderUpdateError) {
          console.error("Error updating elder document:", elderUpdateError);
        }

        // 3. Add a small delay to ensure Firestore update completes
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Refresh the elders list
        console.log("Refreshing elders list after removal");
        await fetchElders();
        
        // 5. Clear selection and close modal
        setSelectedElderId(null);
        setConfirmRemoveElder(null);

        console.log("=== REMOVE COMPLETE ===");

        Alert.alert("Success", `${elder.name} has been successfully removed.`);
      } else {
        Alert.alert("Error", "Caretaker document not found.");
      }
    } catch (error) {
      console.error("=== ERROR REMOVING ELDER ===", error);
      Alert.alert("Error", `Failed to remove elder: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // For local display, you can define styles as needed
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔴 Assigned Elders</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <FontAwesome5 name="user-plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Elder List  */}
      <View style={{ paddingBottom: 20 }}>
        {elders.map((item) => {
          // Find the most recent upcoming task
          let nextTask = "No upcoming tasks";
          if (Reflect.has(item, "tasks") && Array.isArray(item.tasks) && item.tasks.length > 0) {
            const sortedTasks = [...item.tasks].sort((a, b) => {
              const [ah, am] = a.time.split(":");
              const [bh, bm] = b.time.split(":");
              const timeA = new Date(); timeA.setHours(parseInt(ah), parseInt(am));
              const timeB = new Date(); timeB.setHours(parseInt(bh), parseInt(bm));
              return timeA.getTime() - timeB.getTime();
            });
            nextTask = `Upcoming: ${sortedTasks[0].task} at ${sortedTasks[0].time}`;
          }

          const isSelected = selectedElderId === item.id;

          return (
            <View key={item.id} style={styles.cardContainer}>
              <TouchableOpacity
                style={[
                  styles.card,
                  isSelected && styles.selectedCard
                ]}
                onPress={() => {
                  setSelectedElderId(isSelected ? null : item.id);
                }}
                activeOpacity={0.8}
              >
                {/* Selection Checkbox */}
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && (
                      <FontAwesome5 name="check" size={14} color="#fff" />
                    )}
                  </View>
                </View>

                <View style={styles.leftSection}>
                  <View style={[styles.healthIndicator, { backgroundColor: item.health === "Good" ? "#28A745" : item.health === "Average" ? "#FFC107" : "#DC3545" }]} />
                  <FontAwesome5 name="user" size={20} color="#FFA726" style={styles.icon} />
                  <Text style={styles.healthText}>{item.health} Health</Text>
                </View>
                <View style={styles.middleSection}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.age}>
                    Age - <Text style={styles.ageNumber}>{item.age}</Text>
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      router.push({ pathname: "/(tabs)/Notification", params: { elderEmail: item.email } } as any);
                    }}
                  >
                    <Text style={[styles.task, { color: "#E53935", textDecorationLine: "underline" }]}>{nextTask}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.rightSection}>
                  <FontAwesome5 name="heartbeat" size={20} color="#FFA726" style={styles.icon} />
                  <Text style={styles.healthValue}>{item.vitals?.bp || "120/80"}</Text>
                  <Fontisto name="blood" size={20} color="red" style={styles.icon} />
                  <Text style={styles.healthValue}>{item.vitals?.sugar || "90"}</Text>
                </View>
              </TouchableOpacity>
              
              {/* Show Remove Button only when selected */}
              {isSelected && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    removeElder(item);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="user-minus" size={16} color="#fff" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Add Elder Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Find & Add Elder</Text>
            
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
              <TextInput
                placeholder="Elder's Email Address"
                style={[styles.input, { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                value={searchEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(text) => {
                    setSearchEmail(text);
                    setFoundElder(null); // Reset on typing
                }} 
              />
              <TouchableOpacity 
                onPress={verifyElder} 
                style={[styles.saveButton, { width: 80, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                disabled={isSearching}
              >
                <Text style={styles.saveButtonText}>{isSearching ? "..." : "Search"}</Text>
              </TouchableOpacity>
            </View>

            {foundElder && (
              <View style={styles.foundCard}>
                <FontAwesome5 name="user-check" size={30} color="#28A745" style={{ marginBottom: 10 }} />
                <Text style={styles.foundName}>{foundElder.firstName} {foundElder.surname}</Text>
                <Text style={styles.foundDetail}>Age: {foundElder.age || 'N/A'}</Text>
                <Text style={styles.foundDetail}>Health: {foundElder.health || 'Unknown'}</Text>
                
                <TouchableOpacity onPress={addElder} style={[styles.saveButton, { marginTop: 15 }]}>
                  <Text style={styles.saveButtonText}>Confirm & Add User</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              onPress={() => {
                  setModalVisible(false);
                  setSearchEmail("");
                  setFoundElder(null);
              }} 
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal visible={confirmRemoveElder !== null} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Remove Elder</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to remove {confirmRemoveElder?.name}? Their data will no longer appear on your dashboard.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                onPress={() => setConfirmRemoveElder(null)} 
                style={styles.confirmCancelButton}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => executeRemoval(confirmRemoveElder)} 
                style={styles.confirmRemoveButton}
              >
                <Text style={styles.confirmRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 20,
  },
  card: {
    backgroundColor: "#FFEBEE",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: "#FF9A9A",
    borderWidth: 2,
    borderColor: "#E53935",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E53935",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  leftSection: {
    alignItems: "center",
    marginRight: 10,
  },
  healthIndicator: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  healthText: {
    fontSize: 12,
    color: "#E53935",
  },
  middleSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  age: {
    fontSize: 14,
    color: "#555",
  },
  ageNumber: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  task: {
    fontSize: 13,
    color: "#777",
  },
  rightSection: {
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#D32F2F",
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#E53935",
    fontWeight: "bold",
  },
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 0,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  confirmModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  confirmModalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  confirmModalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmModalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  confirmCancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
  confirmRemoveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
  },
  confirmRemoveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  foundCard: {
    width: "100%",
    padding: 15,
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E53935",
    alignItems: "center",
  },
  foundName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  foundDetail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

