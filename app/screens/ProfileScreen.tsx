import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, getDocs, db, auth, updateDoc, arrayRemove } from "../../config/firebaseConfig";

const ProfileScreen = () => {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [assignedElders, setAssignedElders] = useState<any[]>([]);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userData?.userType === "caretaker" && userData?.elders?.length > 0) {
            fetchAssignedElders(userData.elders);
        }
    }, [userData]);

    const fetchUserProfile = async () => {
        try {
            let email = await AsyncStorage.getItem("userEmail");

            // Fallback to Auth current user if storage is empty
            if (!email) {
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.email) {
                    email = currentUser.email;
                    await AsyncStorage.setItem("userEmail", email); // Sync back to storage
                }
            }

            if (!email) {
                console.error("Profile Error: No email found in Storage or Auth.");
                Alert.alert("Error", "No user email found. Please re-login.");
                setLoading(false);
                return;
            }

            console.log("Fetching profile for:", email);
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                console.log("Profile Data Found:", data);
                setUserData(data);
            } else {
                console.warn("Profile Error: User document not found in Firestore.");
                Alert.alert("Error", "User details not found in database.");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            Alert.alert("Error", "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedElders = async (elderIds: string[]) => {
        try {
            const usersRef = collection(db, "users");
            const fetchedElders: any[] = [];

            for (const elderId of elderIds) {
                const elderQuery = query(usersRef, where("uid", "==", elderId));
                let eSnap = await getDocs(elderQuery);
                let elderData = null;
                let elderDocId = null;

                if (!eSnap.empty) {
                    elderData = eSnap.docs[0].data();
                    elderDocId = eSnap.docs[0].id;
                } else {
                    const allUsersSnap = await getDocs(usersRef);
                    allUsersSnap.forEach((doc) => {
                        if (doc.id === elderId) {
                            elderData = doc.data();
                            elderDocId = doc.id;
                        }
                    });
                }

                if (elderData) {
                    fetchedElders.push({
                        docId: elderDocId,
                        id: elderId,
                        email: elderData.email,
                        name: `${elderData.firstName || elderData.name || "Unknown"} ${elderData.surname || ""}`.trim()
                    });
                }
            }
            setAssignedElders(fetchedElders);
        } catch (error) {
            console.error("Error fetching assigned elders for profile:", error);
        }
    };

    const executeRemove = async (elder: any) => {
        try {
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) {
                Platform.OS === 'web' ? alert("User email not found.") : Alert.alert("Error", "User email not found.");
                return;
            }

            const usersRef = collection(db, "users");
            const caretakerQuery = query(usersRef, where("email", "==", email));
            const caretakerSnap = await getDocs(caretakerQuery);

            if (!caretakerSnap.empty) {
                const caretakerDoc = caretakerSnap.docs[0];

                // 1. Remove elder from Caretaker's elders array
                console.log("Attempting to remove elder ID:", elder.id);
                await updateDoc(caretakerDoc.ref, {
                    elders: arrayRemove(elder.id)
                });

                // 2. Remove caretaker connection from Elder document by email (most reliable)
                try {
                    const elderByEmailQuery = query(usersRef, where("email", "==", elder.email));
                    const elderByEmailSnap = await getDocs(elderByEmailQuery);
                    
                    if (!elderByEmailSnap.empty) {
                        const elderDoc = elderByEmailSnap.docs[0];
                        await updateDoc(elderDoc.ref, {
                            caretakerAssigned: null
                        });
                    }
                } catch (elderUpdateError) {
                    console.error("Error updating elder document:", elderUpdateError);
                }

                // Add small delay for Firestore sync
                await new Promise(resolve => setTimeout(resolve, 500));

                // 3. Update local state to reflect UI change immediately
                setAssignedElders(assignedElders.filter(e => e.id !== elder.id));
                setUserData({ 
                    ...userData, 
                    elders: userData.elders.filter((id: string) => id !== elder.id) 
                });

                if (Platform.OS === 'web') {
                    alert(`${elder.name} has been successfully removed.`);
                } else {
                    Alert.alert("Success", `${elder.name} has been successfully removed.`);
                }
            } else {
                Platform.OS === 'web' ? alert("Caretaker document not found.") : Alert.alert("Error", "Caretaker document not found.");
            }
        } catch (error) {
            console.error("Error removing elder:", error);
            Platform.OS === 'web' ? alert("Failed to remove elder.") : Alert.alert("Error", "Failed to remove elder. Please try again.");
        }
    };

    const removeElder = async (elder: any) => {
        const message = `Are you sure you want to remove ${elder.name} from your profile? Their tasks will no longer appear on your schedule.`;
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(message);
            if (confirmed) {
                executeRemove(elder);
            }
        } else {
            Alert.alert(
                "Remove Elder",
                message,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => executeRemove(elder)
                    }
                ]
            );
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            await AsyncStorage.clear();
            router.replace("../(auth)/LoginScreen");
        } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Error", "Failed to log out.");
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    // Try to go back to previous screen
                    router.canGoBack() ? router.back() : router.push({ pathname: "/(tabs)/Home" } as any);
                }} style={styles.backButton}>
                    <FontAwesome5 name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 20 }} />
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={userData?.userType === 'caretaker'
                            ? require("../../assets/images/caretaker.png")
                            : require("../../assets/images/elder.png")}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.name}>{userData?.firstName} {userData?.surname}</Text>
                <Text style={styles.role}>{userData?.userType === "caretaker" ? "Care Taker" : "Elder"}</Text>
            </View>

            {/* Details Section */}
            <View style={styles.detailsContainer}>
                <DetailItem icon="envelope" label="Email" value={userData?.email} />
                <DetailItem icon="phone" label="Phone" value={userData?.contact || userData?.phoneNumber} />
                <DetailItem icon="birthday-cake" label="Age" value={userData?.age} />
                <DetailItem icon="venus-mars" label="Gender" value={userData?.gender} />
                <DetailItem icon="map-marker-alt" label="Address" value={userData?.address} />

                {userData?.userType === "elder" && (
                    <DetailItem icon="notes-medical" label="Medical Conditions" value={userData?.medicalConditions} />
                )}
            </View>

            {/* Assigned Elders Section for CareTaker */}
            {userData?.userType === "caretaker" && assignedElders.length > 0 && (
                <View style={styles.assignedContainer}>
                    <Text style={styles.assignedTitle}>Assigned Elders</Text>
                    {assignedElders.map((elder) => (
                        <View key={elder.id} style={styles.elderItem}>
                            <View style={styles.elderInfo}>
                                <Text style={styles.elderName}>{elder.name}</Text>
                                <Text style={styles.elderEmail}>{elder.email}</Text>
                            </View>
                            <TouchableOpacity style={styles.removeButton} onPress={() => removeElder(elder)}>
                                <FontAwesome5 name="user-minus" size={16} color="#fff" />
                                <Text style={styles.removeText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const DetailItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.detailItem}>
        <View style={styles.iconContainer}>
            <FontAwesome5 name={icon} size={18} color="#FF6B6B" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || "N/A"}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        marginTop: 40,
    },
    backButton: { padding: 10 },
    headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
    profileCard: {
        alignItems: "center",
        marginVertical: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#FFE5E5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    avatar: { width: 80, height: 80, resizeMode: "contain" },
    name: { fontSize: 24, fontWeight: "bold", color: "#333" },
    role: { fontSize: 16, color: "#FF6B6B", marginTop: 5, fontWeight: "500" },
    detailsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F9F9",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFE5E5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    textContainer: { flex: 1 },
    label: { fontSize: 12, color: "#999", marginBottom: 2 },
    value: { fontSize: 16, color: "#333", fontWeight: "500" },
    logoutButton: {
        flexDirection: "row",
        backgroundColor: "#FF6B6B",
        marginHorizontal: 30,
        padding: 15,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#FF6B6B",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    logoutText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
    assignedContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    assignedTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    elderItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF5F5",
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#FFE5E5",
    },
    elderInfo: {
        flex: 1,
    },
    elderName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    elderEmail: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },
    removeButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF6B6B",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    removeText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
        marginLeft: 6,
    },
});

export default ProfileScreen;
