import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColors } from "@/context/ThemeContext";
import { useT } from "@/context/LanguageContext";

function NativeTabLayout() {
  const t = useT();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t.nav.home}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prosjekter">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>{t.nav.projects}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lager">
        <Icon sf={{ default: "archivebox", selected: "archivebox.fill" }} />
        <Label>{t.nav.storage}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="innstillinger">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>{t.nav.settings}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const t = useT();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBtn,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.surface,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: "rgba(160,180,210,0.25)",
          height: isIOS ? 84 : isWeb ? 84 : 64,
          paddingBottom: isIOS ? 28 : isWeb ? 34 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prosjekter"
        options={{
          title: t.nav.projects,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lager"
        options={{
          title: t.nav.storage,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="innstillinger"
        options={{
          title: t.nav.settings,
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="verktoy" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
