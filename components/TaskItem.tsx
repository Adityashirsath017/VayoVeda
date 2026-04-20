import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { db, collection, query, where, getDocs, updateDoc } from "../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TaskProps {
  time: string;
  task: string;
  elder: string;
  status: string;
  color?: string;
  date?: string;
  id?: string;
}

const TaskItem: React.FC<TaskProps> = ({ time, task, elder, status, color, date, id }) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (currentStatus === "Done!" || updating) return;

    setUpdating(true);
    try {
      // Optimistically update UI
      setCurrentStatus("Done!");

      // Find the elder's email — first try AsyncStorage for caretaker's selected elder
      // For caretaker: they add tasks to elder's profile, so we find elder by name
      const usersRef = collection(db, "users");
      const userRole = await AsyncStorage.getItem("userRole");
      const userEmail = await AsyncStorage.getItem("userEmail");

      let elderDoc: any = null;

      if (userRole?.toLowerCase().trim() === "elder") {
        // Elder is marking their own task as done
        const q = query(usersRef, where("email", "==", userEmail));
        const snap = await getDocs(q);
        if (!snap.empty) elderDoc = snap.docs[0];
      } else {
        // Caretaker: find elder by matching task id/date/time (try all assigned elders)
        const caretakerQuery = query(usersRef, where("email", "==", userEmail));
        const caretakerSnap = await getDocs(caretakerQuery);
        if (!caretakerSnap.empty) {
          const caretakerData = caretakerSnap.docs[0].data();
          const elderIds = caretakerData.elders || [];
          for (const elderId of elderIds) {
            const elderQuery = query(usersRef, where("uid", "==", elderId));
            const eSnap = await getDocs(elderQuery);
            if (!eSnap.empty) {
              const eData = eSnap.docs[0].data();
              const elderName = `${eData.firstName || eData.name || ""} ${eData.surname || ""}`.trim();
              // Match by elder name in task or by task id/date/time
              const hasTask = (eData.tasks || []).some((t: any) =>
                (id && t.id === id) ||
                (t.time === time && t.task === task && t.date === date)
              );
              if (hasTask || elderName === elder) {
                elderDoc = eSnap.docs[0];
                break;
              }
            } else {
              // Try by doc id
              const allSnap = await getDocs(usersRef);
              allSnap.forEach((doc) => {
                if (doc.id === elderId) {
                  const eData = doc.data();
                  const hasTask = (eData.tasks || []).some((t: any) =>
                    (id && t.id === id) ||
                    (t.time === time && t.task === task && t.date === date)
                  );
                  if (hasTask) elderDoc = doc;
                }
              });
              if (elderDoc) break;
            }
          }
        }
      }

      if (elderDoc) {
        const elderData = elderDoc.data();
        const updatedTasks = (elderData.tasks || []).map((t: any) => {
          const isMatch = (id && t.id === id) || (t.time === time && t.task === task && t.date === date);
          return isMatch ? { ...t, status: "Done!" } : t;
        });

        await updateDoc(elderDoc.ref, { tasks: updatedTasks });
        console.log("Task status updated to Done! in Firebase ✅");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert on failure
      setCurrentStatus("NA");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.row, { borderLeftWidth: 6, borderLeftColor: color || "#ff6b6b" }]}>
      <View style={[styles.cell, styles.time]}>
        <Text style={styles.text}>{time}</Text>
      </View>
      <View style={[styles.cell, styles.task]}>
        <Text style={styles.text}>{task}</Text>
      </View>
      <View style={[styles.cell, styles.elder]}>
        <Text style={styles.text}>{elder}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.cell,
          styles.status,
          currentStatus === "Done!" ? styles.completed : styles.pending,
        ]}
        onPress={handleStatusChange}
        disabled={currentStatus === "Done!" || updating}
      >
        <Text style={styles.statusText}>
          {updating ? "..." : currentStatus}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ffb3b3",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  time: { flex: 1 },
  task: { flex: 2 },
  elder: { flex: 1.5 },
  status: { flex: 1, borderRadius: 5, paddingVertical: 6, paddingHorizontal: 8 },
  text: { fontSize: 14, fontWeight: "bold", color: "#333" },
  statusText: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
  completed: { backgroundColor: "#d4edda" },
  pending: { backgroundColor: "#f8d7da" },
});

export default TaskItem;
