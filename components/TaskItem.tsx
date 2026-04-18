import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface TaskProps {
  time: string;
  task: string;
  elder: string;
  status: string;
  color?: string;
}

const TaskItem: React.FC<TaskProps> = ({ time, task, elder, status, color }) => {
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleStatusChange = () => {
    if (currentStatus === "NA") {
      setCurrentStatus("Done!");
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
        disabled={currentStatus === "Done!"} // Disables click once status is "Done!"
      >
        <Text style={styles.statusText}>{currentStatus}</Text>
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
