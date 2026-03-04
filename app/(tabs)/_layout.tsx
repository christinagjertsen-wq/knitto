import { Tabs } from "expo-router";
import { Platform, StyleSheet, View, Text } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="prosjekter" />
      <Tabs.Screen name="lager" />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="verktoy" options={{ href: null }} />
      <Tabs.Screen name="innstillinger" />
    </Tabs>
  );
}
