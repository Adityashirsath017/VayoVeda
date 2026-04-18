import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Animated,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
  const router = useRouter(); // ✅ Keep useRouter only inside the component
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Ensure viewableItems is checked before accessing its properties
  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0]?.index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await AsyncStorage.setItem("onboardingShown", "false");
      router.replace("/(auth)/roleselect"); // ✅ Navigate to home screen correctly
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo at the top */}
      <Image source={require("../../assets/images/vayoicon.png")} style={styles.logo} />

      <FlatList
        ref={flatListRef}
        data={slides}
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
          <View style={styles.slide}>
            <Text style={styles.title}>{item.title}</Text>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
        ))}
      </View>

      {/* Get Started / Next Button */}
      <TouchableOpacity onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Onboarding data moved outside the component to prevent re-renders
const slides = [
  {
    id: "1",
    title: "Empowering Care, Simplifying Life",
    description:
      "Caring made easy—Manage schedules, track health, and ensure timely medication in one place.",
    image: require("../../assets/images/elderly1.png"),
  },
  {
    id: "2",
    title: "We Care.",
    description: "Your trusted companion in elderly care management.",
    image: require("../../assets/images/features.png"),
  },
];

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginTop: 30,
    marginBottom: 10,
  },
  slide: {
    width,
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-around",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginTop: 5,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 15,
    marginTop: 5,
  },
  image: {
    width: width * 0.75,
    height: height * 0.4,
    resizeMode: "contain",
    marginBottom: 5,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 90,
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
  button: {
    backgroundColor: "#e57373",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    position: "absolute",
    bottom: 30,
    width: width * 0.85,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
