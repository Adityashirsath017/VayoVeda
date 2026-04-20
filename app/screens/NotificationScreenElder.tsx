import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, collection, query, where, getDocs, auth } from "../../config/firebaseConfig";

export default function NotificationScreenElder() {
  console.log("NotificationScreenElder Mounted");
  const router = useRouter();
  const [bgColor, setBgColor] = useState("#fff");
  const [liveLocation, setLiveLocation] = useState("");
  // 🌏 LIVE RENDER URL
  const SERVER_URL = "https://vayoveda.onrender.com";









  const getLiveLocation = async (): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API for web
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                resolve(`https://www.google.com/maps?q=${latitude},${longitude}`);
              },
              (error) => {
                console.error("Web Geolocation Error:", error);
                resolve("Location Unavailable (Web Error)");
              }
            );
          } else {
            resolve("Geolocation not supported on this browser");
          }
        });
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return "Location Permission Denied";
      }

      // 1. Try Last Known Location (Fastest)
      let location = await Location.getLastKnownPositionAsync({});

      // 2. If null, try Current Location (Slower but accurate)
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      if (location) {
        const { latitude, longitude } = location.coords;
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
      }
      return "Location Unavailable";
    } catch (error) {
      console.error("Error fetching location:", error);
      return "Location Error";
    }
  };


  // --- LOCKED LOGIC START: SOS SMS & Error Handling ---
  const sendSMSToBackend = async (locationLink: string) => {
    try {
      console.log(`[SOS] Sending SMS with location: ${locationLink}`);

      let caretakerPhone = "+919876543210"; // Default Fallback

      try {
        // Find caretaker's email linked to this elder
        // Since elder is logged in, their email is in 'userEmail', we need to query their doc to find their caretaker's email
        const elderEmail = await AsyncStorage.getItem("userEmail");
        if (elderEmail) {
          const usersRef = collection(db, "users");
          const elderQuery = query(usersRef, where("email", "==", elderEmail));
          const elderSnapshot = await getDocs(elderQuery);
          if (!elderSnapshot.empty) {
            const elderData = elderSnapshot.docs[0].data();
            // Then get Caretaker's phone by querying Caretaker doc using either 'caretakerEmail' field or a manual query 
            // Wait, it is simpler: The caretaker stores the list of 'elders' ids. We might have caretakerEmail saved in AsyncStorage
            const cEmail = await AsyncStorage.getItem("caretakerEmail");
            if (cEmail) {
              const cQuery = query(usersRef, where("email", "==", cEmail));
              const cSnapshot = await getDocs(cQuery);
              if (!cSnapshot.empty) {
                const cData = cSnapshot.docs[0].data();
                if (cData.phone) {
                  caretakerPhone = cData.phone;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Could not fetch actual Caretaker phone number, using fallback.");
      }

      const response = await fetch(`${SERVER_URL}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: caretakerPhone, // Update this with actual number
          message: `🚨 HELP! SOS Alert! I need immediate assistance! My current location is: ${locationLink}`
        })
      });

      const data = await response.json();
      console.log("[SOS] SMS Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Server responded with an error");
      }

      if (Platform.OS === 'web') {
        Alert.alert("SOS Sent", `SMS sent to emergency contact.\nLocation: ${locationLink}`);
      }
    } catch (error: any) {
      console.error("Failed to send SOS SMS:", error);

      // Detailed Error Handling for Web
      if (Platform.OS === 'web') {
        let errorMessage = "Failed to send SMS.";
        if (error.message.includes("Network request failed")) {
          errorMessage = "Network Error: Could not connect to server. Check internet.";
        } else if (error.message.includes("Server")) {
          errorMessage = `Server Error: ${error.message}`;
        }
        Alert.alert("SOS Error", `${errorMessage}\nCheck console for details.`);
      }
    }
  };
  // --- LOCKED LOGIC END ---

  const sendNotification = async (body: string) => {
    if (Platform.OS === 'web') {
      console.log("Notification scheduling skipped on web.");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 SOS ALERT 🚨",
        body: body,
      },
      trigger: null,
    });
  };

  // --- LOCKED LOGIC START: SOS Button Action ---
  const handleSOSPress = async () => {
    setBgColor("#8B0000");

    try {
      // 📍 Get location first
      const locationLink = await getLiveLocation();

      // Check if location failed
      if (locationLink.includes("Error") || locationLink.includes("Unavailable") || locationLink.includes("Denied")) {
        if (Platform.OS === 'web') {
          Alert.alert("Location Warning", "Could not fetch precise location. SMS will be sent with error message.");
        }
      }

      await Promise.all([
        sendSMSToBackend(locationLink),
        sendNotification(locationLink),
      ]);
    } catch (criticalError) {
      console.error("Critical SOS Error:", criticalError);
      if (Platform.OS === 'web') {
        Alert.alert("Critical Error", "An unexpected error occurred during SOS. Please call manually.");
      }
    } finally {
      setTimeout(() => setBgColor("#fff"), 5000);
    }
  };
  // --- LOCKED LOGIC END ---

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
        <Text style={styles.sosText}>🚨 EMERGENCY SOS 🚨</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  sosButton: {
    backgroundColor: "#FF0000",
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  sosText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
  },
});