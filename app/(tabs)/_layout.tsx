import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

function TabIcon({
  name,
  focusedName,
  label,
  color,
  focused,
}: {
  name: any;
  focusedName: any;
  label: string;
  color: string;
  focused: boolean;
}) {
  const colors = Colors.light;
  return (
    <View style={{ alignItems: "center", gap: 3, paddingTop: 4 }}>
      <Ionicons name={focused ? focusedName : name} size={22} color={color} />
      <Text
        style={{
          fontSize: 10,
          color,
          fontFamily: focused ? "Inter_600SemiBold" : "Inter_400Regular",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "list.clipboard", selected: "list.clipboard.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lager">
        <Icon sf={{ default: "archivebox", selected: "archivebox.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="verktoy">
        <Icon sf={{ default: "wrench", selected: "wrench.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="innstillinger">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: "#E5EAF2",
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Prosjekter",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="list-outline" focusedName="list" label="Prosjekter" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lager"
        options={{
          title: "Lager",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="archive-outline" focusedName="archive" label="Lager" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="prosjekter"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="verktoy"
        options={{
          title: "Verktøy",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="construct-outline" focusedName="construct" label="Verktøy" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="innstillinger"
        options={{
          title: "Innstillinger",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings-outline" focusedName="settings" label="Innstillinger" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
