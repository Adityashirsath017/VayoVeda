import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { RadioButton } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { useRouter } from "expo-router";
import { db, collection, addDoc } from "../../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CaretakerBasicInfo: React.FC = () => {
  const [gender, setGender] = useState("Female");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");

  const router = useRouter();

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date: Date) => {
    setDob(moment(date).format("DD/MM/YYYY"));
    hideDatePicker();
  };

  // Handler to upload data to Firestore "users" collection, including email from AsyncStorage
  const handleUpload = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) {
        Alert.alert("Error", "User email not found. Please sign in again.");
        return;
      }
      // Upload Elder data to the "users" collection
      const docRef = await addDoc(collection(db, "users"), {
        firstName,
        surname,
        gender,
        contact,
        address,
        dob,
        height,
        weight,
        bloodGroup,
        medicalConditions,
        userType: "elder", // Identify user as an Elder
        email, // Retrieved from AsyncStorage
      });

      Alert.alert("Success", "Elder data added successfully!");
      console.log("Elder added with ID:", docRef.id);
      router.push(`../../(tabs)`);
    } catch (error) {
      console.error("Error adding elder: ", error);
      Alert.alert("Error", "Failed to add elder data.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.container}>
            <Text style={styles.heading}>Registering you as a...</Text>
            <Text style={styles.subHeading}>Elder.</Text>

            <Text style={styles.sectionTitle}>Basic Details</Text>
            <View style={styles.line} />

            {/* First Name & Surname */}
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Surname</Text>
                <TextInput
                  style={styles.input}
                  value={surname}
                  onChangeText={setSurname}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.genderContainer}>
              <Text style={styles.label}>Gender -</Text>
              <RadioButton.Group
                onValueChange={(value) => setGender(value)}
                value={gender}
              >
                <View style={styles.genderRow}>
                  <View style={styles.radioOption}>
                    <RadioButton value="Male" color="#E45555" />
                    <Text style={styles.radioLabel}>Male</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="Female" color="#E45555" />
                    <Text style={styles.radioLabel}>Female</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="Other" color="#E45555" />
                    <Text style={styles.radioLabel}>Other</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {/* Contact & Address */}
            <Text style={styles.label}>Contact No.</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={contact}
              onChangeText={setContact}
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
            />

            {/* Date of Birth */}
            <Text style={styles.label}>Date of Birth</Text>

            {Platform.OS === 'web' ? (
              <View style={[styles.dateInput, { padding: 0 }]}>
                <TextInput
                  style={[styles.input, { outlineStyle: 'none', border: 'none', height: '100%', width: '100%' } as any]}
                  {...({ type: 'date' } as any)}
                  value={dob ? moment(dob, "DD/MM/YYYY").format("YYYY-MM-DD") : ""}
                  onChange={(e: any) => {
                    setDob(moment(e.target.value).format("DD/MM/YYYY"));
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
                  <Text style={dob ? styles.dateText : styles.placeholderText}>
                    {dob || "Select Date"}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={handleConfirm}
                  onCancel={hideDatePicker}
                />
              </>
            )}

            {/* Basic Health Review */}
            <Text style={styles.sectionTitle}>Basic Health Review</Text>
            <View style={styles.line} />

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>

            <Text style={styles.label}>Blood Group</Text>
            <TextInput
              style={styles.input}
              value={bloodGroup}
              onChangeText={setBloodGroup}
            />

            <Text style={styles.label}>Medical Conditions (if any)</Text>
            <TextInput
              style={styles.input}
              value={medicalConditions}
              onChangeText={setMedicalConditions}
            />

            {/* Submit Button */}
            <TouchableOpacity style={styles.button} onPress={handleUpload}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            {/* Terms & Conditions */}
            <Text style={styles.termsText}>
              By continuing you are agreeing to all T&C proposed.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 350,
  },
  heading: {
    fontSize: 18,
    textAlign: "center",
    color: "#333",
    fontWeight: "bold",
  },
  subHeading: {
    fontSize: 20,
    textAlign: "center",
    color: "#E45555",
    marginBottom: 10,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
  line: {
    height: 1,
    backgroundColor: "#E45555",
    width: "80%",
    alignSelf: "center",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    width: "48%",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FDE8E8",
    paddingHorizontal: 10,
  },
  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  button: {
    backgroundColor: "#E45555",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 12,
    color: "#E45555",
    textAlign: "center",
    marginTop: 10,
  },
  dateInput: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FDE8E8",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
  },
});

export default CaretakerBasicInfo;
