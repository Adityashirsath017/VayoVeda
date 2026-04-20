import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  Platform
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, collection, query, where, getDocs, updateDoc, arrayUnion, auth } from "../../config/firebaseConfig";
import { useFocusEffect } from "expo-router";

interface Medication {
  id: string;
  name: string;
  time: string;
  dosage: string;
  schedule: string;
  type?: string;
  uid?: string;
  email?: string;
}

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState({ name: "", time: "", dosage: "", schedule: "", type: "Tablet" });
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const handleTimeConfirm = (date: Date) => {
    const formatted = moment(date).format("hh:mm A");
    setNewMed({ ...newMed, time: formatted });
    setTimePickerVisible(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchMedications = async () => {
        try {
          const email = await AsyncStorage.getItem("userEmail");
          if (!email) return;

          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            
            // Check if this user is a caretaker with assigned elders
            const elderIds = userData.elders || [];
            let allMedications: Medication[] = [];

            if (elderIds && elderIds.length > 0) {
              // User is a caretaker - fetch medications from all assigned elders
              console.log("=== FETCH MEDICATIONS DEBUG ===");
              console.log("Caretaker elders array:", elderIds);

              for (const elderId of elderIds) {
                // Try to find elder by uid first, then by document id
                let elderQuery = query(usersRef, where("uid", "==", elderId));
                let eSnap = await getDocs(elderQuery);
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

                if (eData && eData.medications && Array.isArray(eData.medications)) {
                  const elderName = `${eData.firstName || eData.name || "Unknown"} ${eData.surname || ""}`.trim();
                  console.log("Found medications for elder:", elderName);

                  // Add elder name to each medication for context
                  const medsWithElder = eData.medications.map((med: any) => ({
                    ...med,
                    elderName: elderName,
                  }));
                  allMedications = [...allMedications, ...medsWithElder];
                }
              }
            } else {
              // User is an elder - fetch their own medications
              if (userData.medications && Array.isArray(userData.medications)) {
                allMedications = userData.medications;
              }
            }

            console.log("Total medications fetched:", allMedications.length);
            setMedications(allMedications);
          }
        } catch (error) {
          console.error("Error fetching medications:", error);
        }
      };

      fetchMedications();
    }, [])
  );

  const addMedication = async () => {
    if (newMed.name && newMed.time) {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Authentication Error", "You are not logged in.");
          return;
        }

        const email = await AsyncStorage.getItem("userEmail");
        if (!email) {
          Alert.alert("Error", "User email not found.");
          return;
        }

        // 1. Find the User's Document in 'users' collection
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Error", "User profile not found in database.");
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const medicationData = {
          ...newMed,
          id: Math.random().toString(36).substr(2, 9), // Generate a local ID
          createdAt: new Date().toISOString()
        };

        // 2. Update the user's document with the new medication
        await updateDoc(userDoc.ref, {
          medications: arrayUnion(medicationData)
        });

        console.log("Medication added to user profile:", userDoc.id);

        // Update local state
        setMedications([...medications, medicationData]);
        setNewMed({ name: "", time: "", dosage: "", schedule: "", type: "Tablet" });
        setModalVisible(false);
      } catch (error: any) {
        console.error("Error adding medication:", error);
        Alert.alert("Error", `Failed to add medication: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Add Button */}
      <View style={styles.header}>
        <Text style={styles.heading}>Medication Reminders</Text>
        <TouchableOpacity style={styles.addMButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LinearGradient colors={["#FEE8D5", "#FFE5E5"]} style={styles.medCard}>
            <View style={styles.iconContainer}>
              <FontAwesome name="medkit" size={30} color="#FF3D00" />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{item.name}</Text>
              {item.elderName && <Text style={styles.elderName}>👤 {item.elderName}</Text>}
              <Text style={styles.medSchedule}>{item.schedule}</Text>
              <Text style={styles.medDosage}>{item.dosage}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.timeContainer}>
              <Text style={styles.medTime}>{item.time}</Text>
            </View>
          </LinearGradient>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No medications added yet.</Text>}
      />

      {/* Modal for Adding Medication */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#FF3D00" />
            </TouchableOpacity>

            {/* Medication Image */}
            <Image source={require("@/assets/images/medicine.png")} style={styles.medicineImage} />

            <Text style={styles.modalTitle}>
              Add New <Text style={{ color: "#FF3D00" }}>Medication.</Text>
            </Text>

            {/* Medicine Name Input */}
            <View style={styles.inputContainer}>
              <FontAwesome name="medkit" size={20} color="#FF3D00" style={styles.inputIcon} />
              <TextInput
                placeholder="Medicine Name"
                style={styles.input}
                onChangeText={(text) => setNewMed({ ...newMed, name: text })}
                value={newMed.name}
              />
            </View>

            {/* Medication Type Selection */}
            <View style={styles.categoryContainer}>
              {["Tablet", "Drops", "Syrup", "Injection"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.categoryButton, newMed.type === type && styles.categoryButtonActive]}
                  onPress={() => setNewMed({ ...newMed, type })}
                >
                  <Text style={[styles.categoryText, newMed.type === type && styles.categoryTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dosage Input */}
            <View style={styles.inputContainer}>
              <FontAwesome name="pencil" size={20} color="#FF3D00" style={styles.inputIcon} />
              <TextInput
                placeholder="Dose Ex. 2, 5ml"
                style={styles.input}
                onChangeText={(text) => setNewMed({ ...newMed, dosage: text })}
                value={newMed.dosage}
              />
            </View>

            {/* When to Take Input */}
            <View style={styles.inputContainer}>
              <FontAwesome name="clock-o" size={20} color="#FF3D00" style={styles.inputIcon} />
              <TextInput
                placeholder="When to Take"
                style={styles.input}
                onChangeText={(text) => setNewMed({ ...newMed, schedule: text })}
                value={newMed.schedule}
              />
            </View>

            {/* Reminder Time - Clock Picker */}
            {Platform.OS === 'web' ? (
              <View style={styles.inputContainer}>
                <FontAwesome name="bell" size={20} color="#FF3D00" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  {...({ type: 'time' } as any)}
                  value={newMed.time ? moment(newMed.time, "hh:mm A").format("HH:mm") : ""}
                  onChange={(e) => {
                    const formatted = moment(e.nativeEvent.text, "HH:mm").format("hh:mm A");
                    setNewMed({ ...newMed, time: formatted });
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setTimePickerVisible(true)}
                >
                  <FontAwesome name="bell" size={20} color="#FF3D00" style={styles.inputIcon} />
                  <Text style={[styles.input, { lineHeight: 50, color: newMed.time ? '#333' : '#999' }]}>
                    {newMed.time || "Select Reminder Time"}
                  </Text>
                  <FontAwesome5 name="clock" size={18} color="#FF3D00" />
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isTimePickerVisible}
                  mode="time"
                  onConfirm={handleTimeConfirm}
                  onCancel={() => setTimePickerVisible(false)}
                />
              </>
            )}

            {/* Buttons Container */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={addMedication}>
                <Text style={styles.addButtonText}>Add +</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", paddingBottom: 90 },
  // Header Section
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  heading: { fontSize: 20, fontWeight: "bold" },
  addMButton: { backgroundColor: "red", padding: 10, borderRadius: 8 },
  addText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  // Medication Card
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Icon Container
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  // Medication Info
  medInfo: { flex: 1, marginLeft: 15 },
  medName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  elderName: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 4 },
  medSchedule: { fontSize: 14, color: "red", fontWeight: "bold" },
  medDosage: { fontSize: 14, color: "#666" },
  emptyText: { textAlign: "center", color: "#888", fontSize: 16, marginTop: 20 },
  // Separator
  separator: { width: 1, height: "80%", backgroundColor: "#BDBDBD", marginHorizontal: 10 },
  // Time Box
  timeContainer: { backgroundColor: "red", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  medTime: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  // Modal Styling
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  medicineImage: { width: 100, height: 100, marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF7F7F",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "#FFF5F5",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: "#333" },
  categoryContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 10 },
  categoryButton: { backgroundColor: "#FFCDD2", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  categoryButtonActive: { backgroundColor: "#FF3D00" },
  categoryText: { color: "#333", fontWeight: "bold" },
  categoryTextActive: { color: "#fff" },
  buttonContainer: { marginTop: 10, width: "100%" },
  addButton: { backgroundColor: "#FF3D00", padding: 12, borderRadius: 10, width: "100%", alignItems: "center", marginTop: 10 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeButton: { position: "absolute", top: 15, right: 15, zIndex: 10 },
});
