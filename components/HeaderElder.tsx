import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import moment from "moment";
import { useRouter } from "expo-router";

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  const today = moment().format("MMM D, YYYY");
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>
          👋 Hello, <Text style={styles.name}>{userName || "User"}!</Text>
        </Text>
        <Text style={styles.date}>🟡{today}</Text>
        <Text style={styles.date}>🔴At a Glance!</Text>
      </View>
      <TouchableOpacity onPress={() => router.push("../screens/ProfileScreen")}>
        <FontAwesome5 name="user" size={28} color={"#FFA726"} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  name: {
    color: "#E53935",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  icon: {
    marginLeft: 10,
  },
});
