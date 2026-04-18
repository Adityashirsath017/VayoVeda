import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/index" options={{ title: "Auth" }} />
      <Stack.Screen name="(auth)/roleselect" options={{ title: "Role Select" }} />
      <Stack.Screen name="(auth)/caretakerInfo" options={{ title: "Caretaker Info" }} />
      <Stack.Screen name="(auth)/elderInfo" options={{ title: "Elder Info" }} />
      <Stack.Screen name="(onboarding)/index" options={{ title: "Onboarding" }} />
      <Stack.Screen name="(onboarding)/onboarding" options={{ title: "Onboarding Flow" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
