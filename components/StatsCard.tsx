import { View, Text, Image } from "react-native";
import React from "react";

export default function StatsCard({ title, image }) {
  return (
    <View className="bg-white p-4 rounded-xl shadow-md w-64 h-32 flex items-center justify-center">
      {/* Adjusted Image Size */}
      <Image source={image} style={{ width: 350, height: 350, resizeMode: "contain" }} />
      
      <Text className="mt-2 text-center font-semibold text-gray-700">{title}</Text>
    </View>
  );
}
