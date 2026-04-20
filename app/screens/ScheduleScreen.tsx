import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  ScrollView
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import TaskModal from "../../components/TaskModel";
import TaskItem from "../../components/TaskItem";
import { useLocalSearchParams } from "expo-router";
import {
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  auth
} from "../../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Task {
  time: string;
  task: string;
  elder: string; // This field can be ignored now since we'll use AsyncStorage
  status: string;
  days?: number;
  color?: string;
}

const ScheduleScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [tasks, setTasks] = useState<{ [date: string]: Task[] }>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedElderEmail, setSelectedElderEmail] = useState<string | undefined>();
  const [caretakerElders, setCaretakerElders] = useState<{name: string, email: string}[]>([]);

  function getTodayDate(): string {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  }

  const params = useLocalSearchParams();

  // Get user role and email from AsyncStorage
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        let email = await AsyncStorage.getItem("userEmail");

        if (!email && auth.currentUser?.email) {
          email = auth.currentUser.email;
          await AsyncStorage.setItem("userEmail", email);
        }

        setUserRole(role);
        setUserEmail(email);
        
        // If user is an elder and no specific elder was selected via params, use their own email
        if (role?.toLowerCase().trim() === "elder" && !params.elderEmail) {
          setSelectedElderEmail(email || undefined);
        } else if (params.elderEmail) {
          setSelectedElderEmail(params.elderEmail as string);
        }
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };
    getUser();
  }, [params.elderEmail]);

  // Fallback observer to ensure Elder always has their own email selected
  React.useEffect(() => {
    if (userRole?.toLowerCase().trim() === "elder" && !selectedElderEmail && userEmail) {
      setSelectedElderEmail(userEmail);
    }
  }, [userRole, userEmail, selectedElderEmail]);

  // Fetch Caretaker's Assigned Elders for the selector
  React.useEffect(() => {
    const fetchCaretakerElders = async () => {
      try {
        if (userRole?.toLowerCase().trim() !== "elder" && userEmail) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", userEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            const elderIds = data.elders || [];
            const list: {name: string, email: string}[] = [];
            
            for (const id of elderIds) {
              const eq = query(usersRef, where("uid", "==", id));
              const esnap = await getDocs(eq);
              let eData: any = null;
              if (!esnap.empty) {
                eData = esnap.docs[0].data();
              } else {
                const allUsers = await getDocs(usersRef);
                allUsers.forEach(doc => { if (doc.id === id) eData = doc.data(); });
              }
              if (eData) {
                list.push({
                  name: `${eData.firstName || eData.name || "Unknown"} ${eData.surname || ""}`.trim(),
                  email: eData.email
                });
              }
            }
            setCaretakerElders(list);
          }
        }
      } catch (err) {
        console.log("Error fetching caretaker elders:", err);
      }
    };
    fetchCaretakerElders();
  }, [userRole, userEmail]);

  // Fetch tasks from Firebase on mount
  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (!userEmail) return;

        const usersRef = collection(db, "users");
        
        // If a specific elder is selected, fetch only their tasks
        if (selectedElderEmail) {
          console.log("Fetching tasks for specific elder:", selectedElderEmail);
          const elderQuery = query(usersRef, where("email", "==", selectedElderEmail));
          const elderSnap = await getDocs(elderQuery);

          if (!elderSnap.empty) {
            const elderData = elderSnap.docs[0].data();
            if (elderData.tasks && Array.isArray(elderData.tasks)) {
              const fetchedTasks: { [date: string]: Task[] } = {};
              elderData.tasks.forEach((t: any) => {
                if (t.date) {
                  if (!fetchedTasks[t.date]) {
                    fetchedTasks[t.date] = [];
                  }
                  fetchedTasks[t.date].push(t);
                }
              });
              setTasks(fetchedTasks);
            }
          }
        } else {
          // No specific elder - fetch from all assigned elders
          const caretakerQuery = query(usersRef, where("email", "==", userEmail));
          const caretakerSnapshot = await getDocs(caretakerQuery);

          if (!caretakerSnapshot.empty) {
            const caretakerData = caretakerSnapshot.docs[0].data();
            const elderIds = caretakerData.elders || [];

            console.log("=== FETCH SCHEDULE DEBUG ===");
            console.log("Caretaker elders array:", elderIds);

            const fetchedTasks: { [date: string]: Task[] } = {};

            if (elderIds.length > 0) {
              // Fetch tasks from all assigned elders
              for (const elderId of elderIds) {
                // Try to find elder by uid first, then by document id
                let elderQuery = query(usersRef, where("uid", "==", elderId));
                let eSnap = await getDocs(elderQuery);
                let eData: any = null;

                if (!eSnap.empty) {
                  eData = eSnap.docs[0].data();
                } else {
                  // Try to fetch by document ID
                  const allUsersSnap = await getDocs(collection(db, "users"));
                  allUsersSnap.forEach((doc) => {
                    if (doc.id === elderId) {
                      eData = doc.data();
                    }
                  });
                }

                if (eData && eData.tasks && Array.isArray(eData.tasks)) {
                  const elderName = `${eData.firstName || eData.name || "Unknown"} ${eData.surname || ""}`.trim();
                  console.log("Found tasks for elder:", elderName);

                  // Group tasks by date and add elder name
                  eData.tasks.forEach((t: any) => {
                    if (t.date) {
                      if (!fetchedTasks[t.date]) {
                        fetchedTasks[t.date] = [];
                      }
                      fetchedTasks[t.date].push({
                        ...t,
                        elder: elderName,
                        status: t.status || "NA",
                      });
                    }
                  });
                }
              }
            }

            console.log("Total tasks by date:", Object.keys(fetchedTasks).length);
            setTasks(fetchedTasks);
          }
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, [selectedElderEmail]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  // Convert tasks to markedDates format with colored dots
  const getMarkedDates = () => {
    const marks: any = {};

    Object.keys(tasks).forEach((date) => {
      const dayTasks = tasks[date];
      if (dayTasks && dayTasks.length > 0) {
        const dots = dayTasks.map((t, idx) => ({
          key: `task-${idx}-${date}`,
          color: t.color || "#ff6b6b", // fallback to default primary color
          selectedDotColor: "#fff",
        }));
        marks[date] = { dots };
      }
    });

    // Ensure selected date is also highlighted
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#ff6b6b" };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: "#ff6b6b", dots: [] };
    }

    return marks;
  };

  // Add task and update the specified elder's tasks array in the "users" collection
  const addTask = async (newTask: Task) => {
    try {
      // If no specific elder is selected, show an error
      if (!selectedElderEmail) {
        Alert.alert("Error", "Please select a specific elder to add tasks for them. Click on an elder from the Assigned Elders list.");
        return;
      }

      const daysToSchedule = parseInt((newTask.days || 1).toString(), 10);
      const baseDate = new Date(selectedDate);

      // We will aggregate operations for all days
      const newTasksObj: { [date: string]: Task[] } = { ...tasks };
      const tasksToUpload = [];

      // 🚨 Auth Check
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Error", "You appear to be logged out. Please log in again.");
        return;
      }

      // Loop for the specified number of days
      for (let i = 0; i < daysToSchedule; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split("T")[0];

        // 1. Local state prep
        if (!newTasksObj[dateString]) newTasksObj[dateString] = [];
        newTasksObj[dateString].push(newTask);

        // 2. Database prep
        const taskData = {
          ...newTask,
          date: dateString,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
        };
        tasksToUpload.push(taskData);

        // 🌏 LIVE RENDER URL
        const SERVER_URL = "https://vayoveda.onrender.com";

        try {
          // Fetch caretaker's phone number to send reminder to
          let caretakerPhone = "";
          try {
            // For elder: get caretaker phone via caretakerEmail stored in AsyncStorage
            // For caretaker: use their own phone stored in Firestore
            const cEmail = await AsyncStorage.getItem("caretakerEmail");
            const selfEmail = await AsyncStorage.getItem("userEmail");
            const role = await AsyncStorage.getItem("userRole");
            const lookupEmail = role?.toLowerCase().trim() === "elder" ? cEmail : selfEmail;

            if (lookupEmail) {
              const usersRef2 = collection(db, "users");
              const phoneQuery = query(usersRef2, where("email", "==", lookupEmail));
              const phoneSnap = await getDocs(phoneQuery);
              if (!phoneSnap.empty) {
                const phoneData = phoneSnap.docs[0].data();
                caretakerPhone = phoneData.phone || phoneData.contact || phoneData.phoneNumber || "";
              }
            }
          } catch (phoneErr) {
            console.error("Could not fetch phone for reminder:", phoneErr);
          }

          fetch(`${SERVER_URL}/schedule-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: newTask.task,
              time: newTask.time,
              date: dateString,
              to: caretakerPhone || undefined,
            }),
          }).catch(err => console.error("Failed to schedule SMS", err));
        } catch (smsError) {
          console.error("Failed to schedule SMS (Network/Other):", smsError);
        }
      }

      // Update local state instantly
      setTasks(newTasksObj);

      // Upload all tasks to the selected elder's Firestore document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", selectedElderEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        // Ensure arrayUnion arguments are spread
        await updateDoc(userDoc.ref, {
          tasks: arrayUnion(...tasksToUpload),
        });
        console.log("Tasks added to user profile:", userDoc.id);
        if (Platform.OS === 'web') {
          Alert.alert("Success", "Tasks and Reminders Scheduled!");
        }
      } else {
        console.warn("No user found with email:", selectedElderEmail);
        Alert.alert("Error", "User profile not found.");
      }

      setModalVisible(false);
    } catch (error: any) {
      console.error("Error adding task:", error);
      Alert.alert("Error", `Failed to add task: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>
          {selectedElderEmail ? (userRole?.toLowerCase().trim() === "elder" ? "My " : "Selected Elder's ") : "All Elders' "}
          <Text style={styles.highlight}>Schedule</Text>
        </Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            const isElder = userRole?.toLowerCase().trim() === "elder";
            const targetEmail = selectedElderEmail || (isElder ? userEmail : undefined);
            
            if (targetEmail) {
              setSelectedElderEmail(targetEmail);
              setModalVisible(true);
            } else {
              if (Platform.OS === 'web') {
                alert("Please click on an elder to add tasks for them.");
              } else {
                Alert.alert("Info", "Please click on an elder to add tasks for them.");
              }
            }
          }}
        >
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Elder Selector Row for Caretaker */}
      {userRole?.toLowerCase().trim() !== "elder" && caretakerElders.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.elderSelectorRow}>
          <TouchableOpacity 
            style={[styles.elderChip, !selectedElderEmail && styles.elderChipSelected]} 
            onPress={() => setSelectedElderEmail(undefined)}
          >
            <Text style={[styles.elderChipText, !selectedElderEmail && styles.elderChipTextSelected]}>All</Text>
          </TouchableOpacity>
          {caretakerElders.map((elder) => (
            <TouchableOpacity 
              key={elder.email}
              style={[styles.elderChip, selectedElderEmail === elder.email && styles.elderChipSelected]} 
              onPress={() => setSelectedElderEmail(elder.email)}
            >
              <Text style={[styles.elderChipText, selectedElderEmail === elder.email && styles.elderChipTextSelected]}>{elder.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.subHeader}>
        {selectedElderEmail ? (userRole?.toLowerCase().trim() === "elder" ? "Choose a day to view and manage your schedule." : "Choose a day to view and manage the schedule.") : "Click on an elder from Assigned Elders to add tasks."}
      </Text>

      {/* Calendar */}
      <Calendar
        onDayPress={handleDayPress}
        markingType={'multi-dot'}
        markedDates={getMarkedDates()}
        theme={{
          selectedDayBackgroundColor: "#ff6b6b",
          todayTextColor: "#ff6b6b",
          arrowColor: "#ff6b6b",
        }}
      />

      {/* Task List Section */}
      <View style={styles.taskContainer}>
        {/* Table Header */}
        <View style={styles.taskHeaderRow}>
          <Text style={[styles.taskHeader, { flex: 1 }]}>Time</Text>
          <Text style={[styles.taskHeader, { flex: 2 }]}>Task</Text>
          <Text style={[styles.taskHeader, { flex: 1.5 }]}>Elder</Text>
          <Text style={[styles.taskHeader, { flex: 1 }]}>Status</Text>
        </View>

        {/* Task List */}
        <FlatList
          showsVerticalScrollIndicator={false}
          data={tasks[selectedDate] || []}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <TaskItem {...item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* Task Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingBottom: 90 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  header: { fontSize: 24, fontWeight: "bold" },
  highlight: { color: "#ff6b6b" },
  subHeader: { fontSize: 16, color: "#666", marginBottom: 10 },
  calendar: { marginBottom: 10 },
  taskContainer: {
    flex: 1,
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffe6e6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff6b6b",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ff6b6b",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  taskHeader: { textAlign: "center", fontSize: 14, fontWeight: "bold", color: "#fff" },
  emptyText: { textAlign: "center", color: "#888", marginTop: 10 },
  addButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  addButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  elderSelectorRow: {
    marginVertical: 10,
    maxHeight: 40,
  },
  elderChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#ffe6e6",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ff6b6b",
    justifyContent: "center",
  },
  elderChipSelected: {
    backgroundColor: "#ff6b6b",
  },
  elderChipText: {
    color: "#ff6b6b",
    fontWeight: "bold",
    fontSize: 14,
  },
  elderChipTextSelected: {
    color: "#fff",
  },
});

export default ScheduleScreen;
