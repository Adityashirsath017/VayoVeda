import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { FontAwesome5 } from "@expo/vector-icons";

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: { time: string; task: string; elder: string; status: string; days: number; color: string }) => void;
}

const COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7", "#e84393"];

const TaskModal: React.FC<TaskModalProps> = ({ visible, onClose, onAdd }) => {
  // --- LOCKED LOGIC START: DO NOT REMOVE OR BREAK ---
  // Default time to current time formatted as hh:mm A
  const [time, setTime] = useState(moment().format("hh:mm A"));
  const [task, setTask] = useState("");
  // elder field removed - auto-set from selected elder profile
  const [days, setDays] = useState("1");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // --- LOCKED LOGIC END ---

  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    const formattedTime = moment(date).format("hh:mm A");
    setTime(formattedTime);
    hideTimePicker();
  };

  const handleSubmit = () => {
    if (!time || !task || !days) return alert("Please fill all fields");

    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      return alert("Number of days must be a valid positive integer");
    }

    onAdd({ time, task, elder: "", status: "NA", days: parsedDays, color: selectedColor });
    setTime("");
    setTask("");
    setDays("1");
    setSelectedColor(COLORS[0]);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Add New Task</Text>

          {/* Time Picker Trigger */}
          {/* --- LOCKED LOGIC: Web Compatibility --- */}
          {Platform.OS === 'web' ? (
            <View style={styles.datePickerButton}>
              <TextInput
                style={[styles.datePickerText, { flex: 1, outlineStyle: 'none' } as any]}
                {...({ type: 'time' } as any)}
                value={moment(time, "hh:mm A").isValid() ? moment(time, "hh:mm A").format("HH:mm") : ""}
                onChange={(e) => {
                  const newTime = e.nativeEvent.text;
                  const formatted = moment(newTime, "HH:mm").format("hh:mm A");
                  setTime(formatted);
                }}
              />
              <FontAwesome5 name="clock" size={20} color="#666" style={{ marginLeft: 10 }} />
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={showTimePicker} style={styles.datePickerButton}>
                <Text style={[styles.datePickerText, !time && styles.placeholderText]}>
                  {time || "Select Time (08:00 AM)"}
                </Text>
                <FontAwesome5 name="clock" size={20} color="#666" />
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirm}
                onCancel={hideTimePicker}
              />
            </>
          )}

          <TextInput style={styles.input} placeholder="Task" onChangeText={setTask} value={task} />

          <TextInput
            style={styles.input}
            placeholder="Number of Days (e.g., 7)"
            onChangeText={setDays}
            value={days}
            keyboardType="numeric"
          />

          {/* Color Palette */}
          <Text style={styles.colorLabel}>Task Color Identifier</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorSelected]}
                onPress={() => setSelectedColor(c)}
              >
                {selectedColor === c && <FontAwesome5 name="check" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 15,
  },
  datePickerButton: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#ff6b6b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ccc",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  colorLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSelected: {
    borderColor: "#333",
    transform: [{ scale: 1.1 }],
  },
});

export default TaskModal;
