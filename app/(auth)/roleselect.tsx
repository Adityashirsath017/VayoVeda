import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState<"careTaker" | "elder" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("userRole");
      if (storedRole) {
        setSelectedRole(storedRole as "careTaker" | "elder");
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  const handleRegister = async () => {
    if (selectedRole) {
      await AsyncStorage.setItem("userRole", selectedRole);
      router.push({ pathname: "../SignUpScreen", params: { role: selectedRole } });
    }
  };

  const handleLogin = async () => {
    if (selectedRole) {
      router.push({ pathname: "../LoginScreen", params: { role: selectedRole } });
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/vayoicon.png")} style={styles.logo} />
      <Text style={styles.instruction}>Please select your role:</Text>

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleBox, selectedRole === "careTaker" && styles.selectedRole]}
          onPress={() => setSelectedRole("careTaker")}
        >
          <Image source={require("../../assets/images/caretaker.png")} style={styles.roleImage} />
          <Text style={styles.roleText}>Care Taker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBox, selectedRole === "elder" && styles.selectedRole]}
          onPress={() => setSelectedRole("elder")}
        >
          <Image source={require("../../assets/images/elder.png")} style={styles.roleImage} />
          <Text style={styles.roleText}>Elder</Text>
        </TouchableOpacity>
      </View>

      {/* Radio Buttons */}
      <View style={styles.radioContainer}>
        <TouchableOpacity onPress={() => setSelectedRole("careTaker")}>
          <View style={[styles.radioButton, selectedRole === "careTaker" && styles.radioSelected]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedRole("elder")}>
          <View style={[styles.radioButton, selectedRole === "elder" && styles.radioSelected]} />
        </TouchableOpacity>
      </View>

      <Text style={styles.signUpText}>Compassionate Care for Every Age. ❤️</Text>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleRegister} disabled={!selectedRole}>
        {/* <AntDesign name="google" size={20} color="#fff" style={styles.googleIcon} /> */}
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.signUpText}>Already Registered...?</Text>

      {/* Login Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleLogin} disabled={!selectedRole}>
        {/* <AntDesign name="google" size={20} color="#fff" style={styles.googleIcon} /> */}
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
    
  );
};

export default RoleSelectionScreen;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: "row",
    marginVertical: 20,
  },
  roleBox: {
    width: 140,
    height: 140,
    backgroundColor: "#FBEAEA",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    padding: 10,
  },
  selectedRole: {
    borderWidth: 2,
    borderColor: "#e57373",
  },
  roleImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  roleText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e57373",
    marginHorizontal: 50,
  },
  radioSelected: {
    backgroundColor: "#e57373",
  },
  signUpText: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 15,
    fontWeight: "500",
  },
  signUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DB4437",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "85%",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  googleIcon: {
    marginRight: 10,
  },
});
