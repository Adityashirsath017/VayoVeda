import React, { useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  Animated,
  Image,
  Dimensions,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Text
} from "react-native";
import { useFocusEffect } from "expo-router";
import Header from "../../components/HeaderElder";
import UpcomingReminders from "../../components/UpcomingReminders";
import TaskItem from "../../components/TaskItem";

import { auth, db, collection, query, where, getDocs } from "../../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const statsData = [
  { id: "1", image: require("../../assets/images/dailyActivity.png") },
  { id: "2", image: require("../../assets/images/stayhdr.png") },
  { id: "3", image: require("../../assets/images/exercise.png") },
];

export default function HomeScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [userName, setUserName] = useState("");
  const [medications, setMedications] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserName(`${userData.firstName} ${userData.surname}`);

        // Assuming medications are stored in the user document as an array
        if (userData.medications) {
          setMedications(userData.medications);
        }

        if (userData.tasks && Array.isArray(userData.tasks)) {
          const local = new Date();
          const offset = local.getTimezoneOffset();
          const localDate = new Date(local.getTime() - (offset * 60 * 1000));
          const todayString = localDate.toISOString().split("T")[0];

          const todayTasksList = userData.tasks.filter((t: any) => t.date === todayString);
          setTodaysTasks(todayTasksList);
        }
      }
    } catch (error) {
      console.error("Error fetching home screen data:", error);
    }
  };

  // ... inside component
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0]?.index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <>
        {/* Header Section */}
        <Header userName={userName} />

        {/* Animated Horizontal Scrolling Images */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={statsData}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} />
              </View>
            )}
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {statsData.map((_, index) => (
            <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
          ))}
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaysTasks.length > 0 ? (
            <View style={styles.taskContainer}>
              {/* Table Header */}
              <View style={styles.taskHeaderRow}>
                <Text style={[styles.taskHeader, { flex: 1 }]}>Time</Text>
                <Text style={[styles.taskHeader, { flex: 2 }]}>Task</Text>
                <Text style={[styles.taskHeader, { flex: 1.5 }]}>Elder</Text>
                <Text style={[styles.taskHeader, { flex: 1 }]}>Status</Text>
              </View>
              {todaysTasks.map((task, index) => (
                <TaskItem key={index} {...task} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No tasks scheduled for today.</Text>
          )}
        </View>

        {/* Scrollable Assigned Elders List */}
        <UpcomingReminders medications={medications} />
      </>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingBottom: 90,
  },
  carouselContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  imageContainer: {
    width: width * 0.8,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 40,
  },
  image: {
    width: 400,
    height: 160,
    resizeMode: "contain",
  },
  pagination: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#e57373",
    width: 12,
    height: 12,
  },
  tasksSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  taskContainer: {
    backgroundColor: "#ffe6e6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff6b6b",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    padding: 10,
  },
  taskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ff6b6b",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 5,
  },
  taskHeader: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff"
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginVertical: 10,
  },
});

