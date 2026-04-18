import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "../screens/HomeScreen";
import HomeScreenElder from "../screens/HomeScreenElder";
import HealthScreen from "../screens/HealthScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import ChatScreen from "../screens/ChatScreen";
import NotificationScreen from "../screens/NotificationScreen";
import NotificationScreenElder from "../screens/NotificationScreenElder";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const [role, setRole] = useState<"careTaker" | "elder" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        setRole(storedRole as "careTaker" | "elder");
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />;
  }

  // Function to get tab bar color based on role
  const getTabBarColor = () => {
    return role === "careTaker" ? "#FF6B6B" : "#FFCC80"; // Red for caretakers, blue for elders
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: getTabBarColor() }], // Dynamic color
        headerShown: false,
      }}
    >
      {role === "careTaker" ? (
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="home" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="calendar-alt" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Notification"
            component={NotificationScreen}
            options={{
              tabBarButton: (props) => (
                <TouchableOpacity onPress={props.onPress} style={styles.floatingButton}>
                  <View style={styles.notificationButton}>
                    <FontAwesome5 name="bell" size={24} color="white" />
                  </View>
                </TouchableOpacity>
              ),
            }}
          />
          <Tab.Screen
            name="Health"
            component={HealthScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="heartbeat" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="comment-dots" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreenElder}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="home" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="calendar-alt" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Notification"
            component={NotificationScreenElder}
            options={{
              tabBarButton: (props) => (
                <TouchableOpacity onPress={props.onPress} style={styles.floatingButton}>
                  <View style={styles.notificationButton}>
                    {/* <FontAwesome5 name="bell" size={24} color="white" /> */}
                    <Text style={styles.date}>SOS</Text>
                  </View>
                </TouchableOpacity>
              ),
            }}
          />
          <Tab.Screen
            name="Health"
            component={HealthScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="heartbeat" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <FontAwesome5 name="comment-dots" size={24} color={focused ? "#FFA726" : "#fff"} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.1)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  floatingButton: {
    top: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.3)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
      },
    }),
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  date: {
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
    fontWeight: "bold",
  },
});
