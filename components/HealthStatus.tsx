import { View, Text } from "react-native";
import React from "react";

export default function HealthStatus({ name, age, health }: { name: string; age: number; health: string }) {
  const healthColor = health === "Good" ? "bg-green-500" : health === "Average" ? "bg-yellow-500" : "bg-red-500";

  return (
    <View className="bg-white p-3 mt-2 rounded-lg shadow-md flex-row items-center">
      <View className={`w-3 h-3 rounded-full ${healthColor} mr-2`} />
      <View>
        <Text className="text-gray-800 font-medium">{name}</Text>
        <Text className="text-gray-600 text-sm">Age - {age}</Text>
      </View>
    </View>
  );
}
