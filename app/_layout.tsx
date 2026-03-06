import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { KnittingProvider } from "@/context/KnittingContext";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SubscriptionProvider } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Tilbake" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="merke/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="kvalitet/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="prosjekt/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <KnittingProvider>
                    <UserProvider>
                      <RootLayoutNav />
                    </UserProvider>
                  </KnittingProvider>
                </ThemeProvider>
              </LanguageProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SubscriptionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
