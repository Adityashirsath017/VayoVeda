import { View, Text, FlatList, StyleSheet, ScrollView } from "react-native";
import React from "react";

const schedule = [
  { time: "08:00 AM", task: "Medication", elder: "Mrs. Rao" },
  { time: "08:30 AM", task: "BP Check", elder: "Mrs. Rao" },
  { time: "09:00 AM", task: "Meal Assistance", elder: "Mr. Sharma" },
];

export default function ScheduleScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Header */}
      <Text style={styles.title}>Schedule</Text>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 1 }]}>Time</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Task</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Elder Name</Text>
      </View>

      {/* Table Content - FlatList inside ScrollView */}
      <FlatList
        data={schedule}
        keyExtractor={(item, index) => index.toString()}
        nestedScrollEnabled={true}  // ✅ Fix: Enables proper scrolling inside ScrollView
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 1 }]}>{item.time}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{item.task}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{item.elder}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ffcccc",
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cell: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
});
