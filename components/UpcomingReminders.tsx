

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
import moment from "moment";

interface Medication {
  id: string;
  name: string;
  schedule: string;
  dosage: string;
  time: string;
}

interface UpcomingRemindersProps {
  medications: Medication[];
}

export default function UpcomingReminders({ medications }: UpcomingRemindersProps) {
  // Generate next 7 days dynamically
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = moment().add(i, 'days');
    return {
      id: date.format("YYYY-MM-DD"),
      day: date.format("DD"),
      month: date.format("MMM")
    };
  });

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Upcoming Medical Reminders :</Text>

      {/* Horizontal List of Dates */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScroll}
      >
        {dates.map((item) => (
          <View key={item.id} style={styles.dateBox}>
            <Text style={styles.dateDay}>{item.day}</Text>
            <Text style={styles.dateMonth}>{item.month}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Medication List */}
      {medications.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>No upcoming reminders found.</Text>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.medCard}>
              {/* Pill Icon */}
              <View style={styles.iconContainer}>
                <Image
                  source={require("../assets/images/pill.png")}
                  style={styles.icon}
                />
              </View>

              {/* Middle Section: Name, Schedule, Dosage */}
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medSchedule}>{item.schedule}</Text>
                <Text style={styles.medDosage}>{item.dosage}</Text>
              </View>

              {/* Time on the Right */}
              <View style={styles.timeContainer}>
                <Text style={styles.medTime}>{item.time}</Text>
              </View>
            </View>
          )}
          style={{ marginTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  // Horizontal Date Scroll
  dateScroll: {
    marginBottom: 15,
  },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F44336", // Red color for day
  },
  dateMonth: {
    fontSize: 14,
    color: "#333",
  },
  // Medication Card
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7F0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFD36E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  medSchedule: {
    fontSize: 14,
    color: "#FF3D00",
    fontWeight: "500",
  },
  medDosage: {
    fontSize: 14,
    color: "#666",
  },
  timeContainer: {
    backgroundColor: "#FF3D00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  medTime: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
