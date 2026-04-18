import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  db,
  collection,
  query,
  where,
  getDocs,
  documentId,
  auth
} from "../../config/firebaseConfig";

interface Task {
  task: string;
  time: string;
  elderName: string;
  elderId: string;
}

interface Medication {
  name: string;
  schedule: string;
  dosage: string;
  time: string;
  elderName: string;
  elderId: string;
}

export default function NotificationScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const params = useLocalSearchParams();
  const selectedElderEmail = params.elderEmail as string | undefined;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Retrieve caretaker's email from AsyncStorage
      const caretakerEmail = await AsyncStorage.getItem("userEmail");

      const user = auth.currentUser;
      if (!user) {
        console.warn("Notification Fetch: No authenticated user found.");
        setLoading(false);
        return;
      }

      if (!caretakerEmail) {
        Alert.alert("Error", "Caretaker email not found.");
        return;
      }

      let allTasks: Task[] = [];
      let allMeds: Medication[] = [];

      // If an elderEmail was passed via router, fetch ONLY that elder's notifications
      if (selectedElderEmail) {
        const elderQuery = query(collection(db, "users"), where("email", "==", selectedElderEmail));
        const elderSnapshot = await getDocs(elderQuery);

        if (!elderSnapshot.empty) {
          const elderDoc = elderSnapshot.docs[0];
          const elderData = elderDoc.data();
          const elderName = elderData.name || "Unknown Elder";

          if (Array.isArray(elderData.tasks)) {
            allTasks = elderData.tasks.map((task: any) => ({
              ...task,
              elderName,
              elderId: elderDoc.id,
            }));
          }
          if (Array.isArray(elderData.medications)) {
            allMeds = elderData.medications.map((med: any) => ({
              ...med,
              elderName,
              elderId: elderDoc.id,
            }));
          }
        }
      } else {
        // If no specific elder is selected, fetch for ALL assigned elders
        // Query the "users" collection for the caretaker's document
        const usersRef = collection(db, "users");
        const caretakerQuery = query(usersRef, where("email", "==", caretakerEmail));
        const caretakerSnapshot = await getDocs(caretakerQuery);
        if (caretakerSnapshot.empty) {
          setLoading(false);
          return;
        }
        const caretakerDoc = caretakerSnapshot.docs[0];
        const caretakerData = caretakerDoc.data();
        const assignedElders = caretakerData.elders || [];
        if (assignedElders.length === 0) {
          setTasks([]);
          setMedications([]);
          setLoading(false);
          return;
        }

        // Query the "users" collection for elder documents using the assignedElders IDs
        const eldersQuery = query(collection(db, "users"), where(documentId(), "in", assignedElders));
        const eldersSnapshot = await getDocs(eldersQuery);

        eldersSnapshot.docs.forEach((elderDoc) => {
          const elderData = elderDoc.data();
          const elderName = elderData.name || "Unknown Elder";
          // If the elder document has a tasks array, add tasks with additional elder info
          if (Array.isArray(elderData.tasks)) {
            const tasksWithElder = elderData.tasks.map((task: any) => ({
              ...task,
              elderName,
              elderId: elderDoc.id,
            }));
            allTasks = allTasks.concat(tasksWithElder);
          }
          // If the elder document has a medications array, add medications with additional elder info
          if (Array.isArray(elderData.medications)) {
            const medsWithElder = elderData.medications.map((med: any) => ({
              ...med,
              elderName,
              elderId: elderDoc.id,
            }));
            allMeds = allMeds.concat(medsWithElder);
          }
        });
      }

      setTasks(allTasks);
      setMedications(allMeds);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to fetch notifications.");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Notification Screen</Text>

      <Text style={styles.subHeading}>Tasks</Text>
      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No tasks found.</Text>
      ) : (
        tasks.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{item.task}</Text>
            <Text>Time: {item.time}</Text>
            <Text>Elder: {item.elderName}</Text>
          </View>
        ))
      )}

      <Text style={styles.subHeading}>Medications</Text>
      {medications.length === 0 ? (
        <Text style={styles.emptyText}>No medications found.</Text>
      ) : (
        medications.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text>Schedule: {item.schedule}</Text>
            <Text>Dosage: {item.dosage}</Text>
            <Text>Time: {item.time}</Text>
            <Text>Elder: {item.elderName}</Text>
          </View>
        ))
      )}

      {loading && <Text style={styles.loadingText}>Loading...</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", paddingBottom: 90 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subHeading: { fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  emptyText: { fontSize: 16, color: "#888", marginBottom: 10 },
  loadingText: { fontSize: 16, color: "#888", marginTop: 10 },
  itemContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: "bold" },
});
