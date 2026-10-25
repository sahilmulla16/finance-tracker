import * as Sentry from "@sentry/react-native";
import React, { useEffect } from "react";

Sentry.init({
  dsn: "https://0c86f6079fb78fb72427b5b57d58253f@o4508620034473984.ingest.us.sentry.io/4512315183857664",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});
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
import { WalkthroughProvider } from "@/context/WalkthroughContext";
import { WalkthroughOverlay } from "@/components/walkthrough/WalkthroughOverlay";
import { useColors } from "@/hooks/useColors";
import { VoiceLoggingModal } from "@/components/VoiceLoggingModal";
import { ExpenseCelebrationModal } from "@/components/ExpenseCelebrationModal";
import { MerchantMemoryModal } from "@/components/MerchantMemoryModal";
import { preloadMascots } from "@/utils/mascotPreloader";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinancialNotifications } from "@/hooks/useFinancialNotifications";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/config/posthog";

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  useFinancialNotifications();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    loading,
    onboardingState,
    authState,
    voiceLoggingVisible,
    setVoiceLoggingVisible,
  } = useFinance();
  const segments = useSegments();
  const router = useRouter();
  const isDark = colors.canvas === "#090B0A";

  useEffect(() => {
    // Pre-warm mascot cache in background so all screens render mascots immediately
    void preloadMascots();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Hide native splash once both fonts and finance data are ready
    SplashScreen.hideAsync().catch(() => {});

    const currentSegment = segments[0] as string | undefined;
    const isAuthRoute =
      currentSegment === "welcome" ||
      currentSegment === "onboarding" ||
      currentSegment === "user-name" ||
      currentSegment === "basic-setup";
    const isLegalRoute =
      currentSegment === "privacy" || currentSegment === "terms";

    if (!onboardingState.completed) {
      if (!isAuthRoute && !isLegalRoute) {
        router.replace("/welcome" as never);
      }
    } else {
      // If onboarding is completed and user is at root / index, send to tabs
      if (!currentSegment || currentSegment === "index") {
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
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 28),
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Image
            source={require("@/assets/images/zeno-logo.png")}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#4B5563",
              letterSpacing: 0.6,
              marginBottom: 3,
            }}
          >
            developed by
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000000",
              letterSpacing: 0.2,
            }}
          >
            @_sahiltech
          </Text>
        </View>
      </View>
    );
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
              headerShown: false,
              headerBackTitle: "Back",
              contentStyle: { backgroundColor: colors.canvas },
              animation: "default",
            }}
          >
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="user-name" options={{ headerShown: false }} />
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
            <Stack.Screen name="daily-spend" options={{ headerShown: false }} />
            <Stack.Screen name="spending" options={{ headerShown: false }} />
            <Stack.Screen
              name="category-expenses"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="quick-add-settings"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="smart-auto-track"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="notification-settings"
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
            <Stack.Screen
              name="merchant-rules"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="export-data"
              options={{ headerShown: false }}
            />
          </Stack>
          <VoiceLoggingModal
            visible={voiceLoggingVisible}
            onClose={() => setVoiceLoggingVisible(false)}
          />
          <WalkthroughOverlay />
          <ExpenseCelebrationModal />
          <MerchantMemoryModal />
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  const app = (
    <FinanceProvider>
      <WalkthroughProvider>
        <ThemedApp />
      </WalkthroughProvider>
    </FinanceProvider>
  );

  return posthog ? (
    <PostHogProvider client={posthog} autocapture={false}>
      {app}
    </PostHogProvider>
  ) : (
    app
  );
}

export default Sentry.wrap(RootLayout);
