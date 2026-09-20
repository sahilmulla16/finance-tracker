import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const colors = useColors();
  const { loading, onboardingState, authState } = useFinance();
  const segments = useSegments();
  const router = useRouter();
  const isDark = colors.canvas === "#090B0A";

  useEffect(() => {
    if (loading) return;

    // Hide native splash once both fonts and finance data are ready
    SplashScreen.hideAsync().catch(() => {});

    const currentSegment = segments[0] as string | undefined;
    const isAuthRoute =
      currentSegment === "welcome" ||
      currentSegment === "onboarding" ||
      currentSegment === "basic-setup";
    const isLegalRoute =
      currentSegment === "privacy" || currentSegment === "terms";

    if (!onboardingState.completed) {
      if (!isAuthRoute && !isLegalRoute) {
        router.replace("/welcome" as never);
      }
    } else {
      // Onboarding completed:
      // If user is already authenticated, don't allow auth routes
      if (isAuthRoute && authState?.isAuthenticated) {
        router.replace("/(tabs)");
      } else if (
        currentSegment === "onboarding" ||
        currentSegment === "basic-setup"
      ) {
        // Even if not authenticated, skip intro slides if already completed
        router.replace("/(tabs)");
      }
    }
  }, [
    loading,
    onboardingState.completed,
    authState?.isAuthenticated,
    segments,
    router,
  ]);

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.canvas }}>
      <ErrorBoundary>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: colors.canvas }}
        >
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerBackTitle: "Back",
              contentStyle: { backgroundColor: colors.canvas },
              animation: "default",
            }}
          >
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="basic-setup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="accounts" options={{ headerShown: false }} />
            <Stack.Screen name="currency" options={{ headerShown: false }} />
            <Stack.Screen name="categories" options={{ headerShown: false }} />
            <Stack.Screen name="appearance" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="restore" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="savings" options={{ headerShown: false }} />
            <Stack.Screen
              name="quick-add-settings"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-and-data"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-inventory"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-consents"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-requests"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-nominee"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="privacy-retention"
              options={{ headerShown: false }}
            />
          </Stack>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <FinanceProvider>
      <ThemedApp />
    </FinanceProvider>
  );
}
