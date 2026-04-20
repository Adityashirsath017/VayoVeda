import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Listen for Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in — check if role is stored
        const role = await AsyncStorage.getItem("userRole");
        if (role) {
          setIsLoggedIn(true);
        } else {
          // Logged in Firebase but no role stored yet — redirect to roleselect
          setIsLoggedIn(false);
        }
      } else {
        // Not logged in
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/roleselect" />;
}
