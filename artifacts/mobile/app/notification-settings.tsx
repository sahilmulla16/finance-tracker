import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toggle } from "@/components/ui/Toggle";
import { useFinancialNotifications } from "@/hooks/useFinancialNotifications";
import { useFinance } from "@/context/FinanceContext";
import { money, currencySymbol } from "@/utils/format";

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = colors.canvas !== "#FFFFFF";
  const { settings } = useFinance();

  const {
    preferences,
    updatePreferences,
    permissionGranted,
    canAskAgain,
    requestPermission,
  } = useFinancialNotifications();

  // Daily Limit Modal State
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [tempLimit, setTempLimit] = useState(
    preferences.dailySpendingLimitAmount?.toString() || "1500",
  );

  const handleToggle = async (key: keyof typeof preferences, val: any) => {
    void Haptics.selectionAsync();
    await updatePreferences({ [key]: val });
  };

  const handleSaveDailyLimit = async () => {
    const parsed = parseFloat(tempLimit.replace(/,/g, ""));
    if (!isNaN(parsed) && parsed > 0) {
      await updatePreferences({ dailySpendingLimitAmount: parsed });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setLimitModalVisible(false);
  };

  const handleOpenSettings = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (canAskAgain && !permissionGranted) {
      await requestPermission();
    } else {
      void Linking.openSettings();
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Navigation Header */}
      <View style={[styles.navBar, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceRecessed }]}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={colors.fg} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.fg }]}>
          Notification Settings
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status Banner */}
        <Pressable
          onPress={handleOpenSettings}
          style={[
            styles.bannerCard,
            {
              backgroundColor: permissionGranted
                ? isDark
                  ? "rgba(183, 255, 99, 0.08)"
                  : "rgba(16, 185, 129, 0.08)"
                : isDark
                  ? "rgba(245, 158, 11, 0.12)"
                  : "rgba(245, 158, 11, 0.1)",
              borderColor: permissionGranted
                ? isDark
                  ? "rgba(183, 255, 99, 0.3)"
                  : "#10B981"
                : "#F59E0B",
            },
          ]}
        >
          <Feather
            name={permissionGranted ? "check-circle" : "alert-circle"}
            size={20}
            color={permissionGranted ? colors.primary : "#F59E0B"}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.fg }]}>
              {permissionGranted
                ? "Android Notifications: Active"
                : "Notification Access Required"}
            </Text>
            <Text style={[styles.bannerSub, { color: colors.fgMuted }]}>
              {permissionGranted
                ? "Local financial alerts and spending summaries are delivered on-device."
                : "Notifications are blocked by system settings. Tap to grant permission."}
            </Text>
          </View>
          {!permissionGranted && (
            <Feather name="chevron-right" size={18} color="#F59E0B" />
          )}
        </Pressable>

        {/* Master Control */}
        <Card style={styles.card}>
          <ListItem
            title="Enable Financial Notifications"
            subtitle="Deliver offline on-device alerts and summaries"
            trailing={
              <Toggle
                value={preferences.enabled}
                onValueChange={(val) => void handleToggle("enabled", val)}
              />
            }
          />
        </Card>

        {preferences.enabled && (
          <>
            {/* Section 1: Budget Alerts */}
            <SectionHeader title="BUDGET ALERTS" />
            <Card style={styles.card}>
              <ListItem
                title="80% Budget Warning"
                subtitle="Alerts when spending reaches 80% of any budget"
                trailing={
                  <Toggle
                    value={preferences.budget80Alerts}
                    onValueChange={(val) =>
                      void handleToggle("budget80Alerts", val)
                    }
                  />
                }
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
              <ListItem
                title="100% Budget Limit Reached"
                subtitle="Alerts immediately when a budget limit is hit or exceeded"
                trailing={
                  <Toggle
                    value={preferences.budget100Alerts}
                    onValueChange={(val) =>
                      void handleToggle("budget100Alerts", val)
                    }
                  />
                }
              />
            </Card>

            {/* Section 2: Daily Spending Limit */}
            <SectionHeader title="DAILY SPENDING LIMIT" />
            <Card style={styles.card}>
              <ListItem
                title="Daily Spending Limit Alert"
                subtitle="Alerts when daily spending crosses your target limit"
                trailing={
                  <Toggle
                    value={preferences.dailySpendingLimitEnabled}
                    onValueChange={(val) =>
                      void handleToggle("dailySpendingLimitEnabled", val)
                    }
                  />
                }
              />
              {preferences.dailySpendingLimitEnabled && (
                <>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                  <ListItem
                    title="Daily Limit Amount"
                    subtitle={`${money(preferences.dailySpendingLimitAmount || 1500, settings.currency)} per day`}
                    trailing={
                      <Feather name="edit-2" size={16} color={colors.primary} />
                    }
                    onPress={() => {
                      setTempLimit(
                        preferences.dailySpendingLimitAmount?.toString() ||
                          "1500",
                      );
                      setLimitModalVisible(true);
                    }}
                  />
                </>
              )}
            </Card>

            {/* Section 3: Spending Summaries & Insights */}
            <SectionHeader title="SUMMARIES & INSIGHTS" />
            <Card style={styles.card}>
              <ListItem
                title="Daily Spending Summary"
                subtitle={`Scheduled daily at ${preferences.dailySummaryTime || "21:00"}`}
                trailing={
                  <Toggle
                    value={preferences.dailySummaryEnabled}
                    onValueChange={(val) =>
                      void handleToggle("dailySummaryEnabled", val)
                    }
                  />
                }
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
              <ListItem
                title="Monthly Spending Summary"
                subtitle={`Scheduled on the last day of month at ${preferences.monthlySummaryTime || "20:00"}`}
                trailing={
                  <Toggle
                    value={preferences.monthlySummaryEnabled}
                    onValueChange={(val) =>
                      void handleToggle("monthlySummaryEnabled", val)
                    }
                  />
                }
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
              <ListItem
                title="Weekly Money Recap"
                subtitle={`Sunday evening recap at ${preferences.weeklyInsightsTime || "20:00"}`}
                trailing={
                  <Toggle
                    value={preferences.weeklyInsightsEnabled}
                    onValueChange={(val) =>
                      void handleToggle("weeklyInsightsEnabled", val)
                    }
                  />
                }
              />
            </Card>

            {/* Section 4: Quiet Hours */}
            <SectionHeader title="DO NOT DISTURB" />
            <Card style={styles.card}>
              <ListItem
                title="Quiet Hours"
                subtitle="Silence immediate alerts between 10:00 PM and 7:00 AM"
                trailing={
                  <Toggle
                    value={preferences.quietHoursEnabled}
                    onValueChange={(val) =>
                      void handleToggle("quietHoursEnabled", val)
                    }
                  />
                }
              />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Daily Limit Edit Modal */}
      <Modal
        visible={limitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLimitModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surfaceElevated || colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.fg }]}>
              Daily Spending Limit
            </Text>
            <Text style={[styles.modalSub, { color: colors.fgMuted }]}>
              Enter the maximum amount you'd like to spend per day before
              receiving an alert.
            </Text>

            <View
              style={[
                styles.modalInputWrap,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.modalCurrencySymbol, { color: colors.primary }]}
              >
                {currencySymbol(settings.currency)}
              </Text>
              <TextInput
                value={tempLimit}
                onChangeText={setTempLimit}
                keyboardType="numeric"
                style={[styles.modalInput, { color: colors.fg }]}
                placeholder="1500"
                placeholderTextColor={colors.fgSubtle}
                autoFocus
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setLimitModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text
                  style={[styles.modalCancelText, { color: colors.fgMuted }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveDailyLimit}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.modalSaveText, { color: colors.onPrimary }]}
                >
                  Save Limit
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  bannerSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    overflow: "hidden",
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[5],
  },
  modalCard: {
    width: "100%",
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    gap: spacing[3],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalSub: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  modalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 48,
    gap: spacing[2],
  },
  modalCurrencySymbol: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalInput: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[2],
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
