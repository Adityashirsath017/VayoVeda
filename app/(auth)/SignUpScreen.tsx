import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem("userEmail", userCredential.user.email || "");
      const role = await AsyncStorage.getItem("userRole");
      if (role === "careTaker") {
        router.push("/caretakerInfo");
      } else if (role === "elder") {
        router.push("/elderInfo");
      } else {
        alert("Please select a role (Elder/Caretaker) from the Home Screen first before signing up directly.");
        router.push("../../"); // If role is not set, send back to home
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    // webClientId: "326742311913-j50ceko9idm2g1nbnb1quk2apo485s4p.apps.googleusercontent.com",
    webClientId: "268139890986-9h6rilv0b506ofldgdr7tcki5759mroo.apps.googleusercontent.com",
    // redirectUri: AuthSession.getRedirectUrl(),
  });

  useEffect(() => {
    const handleGoogleSignIn = async () => {
      if (response?.type === "success") {
        try {
          const { id_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token);
          const userCredential = await signInWithCredential(auth, credential);
          await AsyncStorage.setItem("userEmail", userCredential.user.email || "");
          router.replace("/screens/HomeScreen");
        } catch (error) {
          console.log(error instanceof Error ? error.message : "An unexpected error occurred");
        }
      }
    };

    handleGoogleSignIn();
  }, [response]);

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/elderly1.png")} style={styles.medicineImage} />
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Enter your Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Enter your Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e57373", marginBottom: 20 },
  input: { width: "90%", padding: 15, borderRadius: 8, borderWidth: 1, borderColor: "#e57373", marginBottom: 12 },
  button: { backgroundColor: "#e57373", padding: 15, borderRadius: 8, width: "90%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  googleButton: { marginTop: 15, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e57373", width: "90%", alignItems: "center" },
  googleButtonText: { color: "#e57373", fontWeight: "bold", fontSize: 16 },
  medicineImage: { width: 100, height: 100, marginBottom: 10 },
});
