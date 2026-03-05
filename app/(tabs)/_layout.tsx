import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Colors from "@/constants/colors";

function TabBarBackground() {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.surface }]} />;
  }
  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 80 : 60}
      tint="light"
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function TabLayout() {
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBtn,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(160,180,210,0.25)',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hjem',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prosjekter"
        options={{
          title: 'Prosjekter',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lager"
        options={{
          title: 'Lager',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="innstillinger"
        options={{
          title: 'Mer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="verktoy" options={{ href: null }} />
    </Tabs>
  );
}
