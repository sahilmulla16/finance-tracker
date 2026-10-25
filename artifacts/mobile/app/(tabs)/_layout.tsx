import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { spacing, radius } from "@/constants/tokens";
import { triggerQuickAdd } from "@/utils/quickAddEvent";
import { haptics } from "@/utils/haptics";
import { useFinance } from "@/context/FinanceContext";
import { ZenoNavLogo } from "@/components/ui";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>Zeno AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="budgets">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Budgets</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { setVoiceLoggingVisible } = useFinance();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isLongPressRef = React.useRef(false);

  return (
    <>
      <Tabs
        screenListeners={{
          tabPress: () => {
            void haptics.selection();
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 88,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.tabBarBg },
                ]}
              />
            ),
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "Zeno AI",
            tabBarIcon: ({ color, focused }) => (
              <ZenoNavLogo color={color} size={22} focused={focused} />
            ),
          }}
        />
        {/* Analytics / Insights — retained as hidden route for backwards-compatibility */}
        <Tabs.Screen
          name="insights"
          options={{
            title: "Analytics",
            href: null,
          }}
        />
        {/* Center Add button — hidden from tab bar, rendered as custom FAB */}
        <Tabs.Screen
          name="add-transaction"
          options={{
            title: "",
            tabBarIcon: () => null,
            tabBarButton: () => (
              <View style={styles.fabContainer}>
                <Pressable
                  onPress={() => {
                    if (isLongPressRef.current) {
                      isLongPressRef.current = false;
                      return;
                    }
                    void haptics.low();
                    triggerQuickAdd("EXPENSE");
                  }}
                  onLongPress={() => {
                    isLongPressRef.current = true;
                    void haptics.success();
                    setVoiceLoggingVisible(true);
                  }}
                  delayLongPress={2000}
                  style={[
                    styles.fab,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                  accessibilityLabel="Add Transaction. Hold for 2 seconds to activate Voice Logging."
                >
                  <Feather name="plus" size={28} color={colors.onPrimary} />
                </Pressable>
              </View>
            ),
          }}
        />
        {/* Expenses — hidden from tab bar, accessible via Home → See all */}
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Transactions",
            href: null,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: "Budgets",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="creditcard" tintColor={color} size={22} />
              ) : (
                <Feather name="pie-chart" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="person" tintColor={color} size={22} />
              ) : (
                <Feather name="user" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B7FF63",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
