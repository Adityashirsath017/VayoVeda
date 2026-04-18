import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  // Get role passed from RoleSelectionScreen
  const params = useLocalSearchParams();
  const role = params.role as string;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save session data
      await AsyncStorage.setItem("userEmail", email);

      // If role is passed, use it. Otherwise, try to fetch from Firestore (fallback)
      // For now, we trust the RoleSelection flow or previously stored role if any
      let finalRole = role;

      if (!finalRole) {
        // Fallback: check storage or default to careTaker if desperate (or fetch from DB)
        // Ideally, we should fetch from DB here, but to keep it simple and fix the immediate issue:
        const storedRole = await AsyncStorage.getItem("userRole");
        if (storedRole) finalRole = storedRole;
      }

      if (finalRole) {
        await AsyncStorage.setItem("userRole", finalRole);

        // 3. Navigate
        // We use replace to prevent going back to login
        router.replace("../../(tabs)");
      } else {
        Alert.alert("Error", "Role not determined. Please contact support.");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.welcome}>Welcome <Text style={styles.bold}>Back!</Text></Text>
      <Text style={styles.subtext}>Please enter your credentials.</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("../roleselect")}>
          <Text style={styles.signupLinkText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  bold: {
    color: "#e57373",
  },
  subtext: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  input: {
    width: "90%",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e57373",
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  forgotText: {
    color: "#e57373",
    marginBottom: 20,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#e57373",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLinkText: {
    color: "#e57373",
    fontWeight: "bold",
    fontSize: 14,
  },
});
