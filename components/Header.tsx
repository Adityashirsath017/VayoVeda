import { View, Text, Image, TouchableOpacity, Platform } from "react-native";
import React, { useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, getDocs, db } from "../config/firebaseConfig";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserName = async () => {
        try {
          const email = await AsyncStorage.getItem("userEmail");
          if (!email) return;

          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const fullName = `${userData.firstName || userData.name || ""} ${userData.surname || ""}`.trim();
            setUserName(fullName || "User");
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      };

      fetchUserName();
    }, [])
  );

  return (
    <View style={[styles.headerContainer, { marginTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>
          👋 Hello, <Text style={styles.name}>{userName}</Text>
        </Text>
        <Text style={styles.date}>Today</Text>
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
