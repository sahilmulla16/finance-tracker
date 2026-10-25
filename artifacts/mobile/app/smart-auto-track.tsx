import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  NativeModules,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight, lineHeight } from "@/constants/tokens";

export default function SmartAutoTrackScreen() {
  const {
    quickAddSettings,
    updateQuickAddSettings,
    merchantRules,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.canvas !== "#FFFFFF";

  const [notifListenerStatus, setNotifListenerStatus] = useState<
    "enabled" | "disabled" | "checking"
  >("checking");
  const [autoTrackEnabled, setAutoTrackEnabled] = useState(
    quickAddSettings.upiDetectionTrigger ?? true,
  );

  const checkStatus = useCallback(async () => {
    if (Platform.OS !== "android") {
      setNotifListenerStatus("disabled");
      return;
    }
    try {
      const isEnabled =
        await NativeModules.PocketflowQuickAdd?.isNotificationListenerEnabled();
      setNotifListenerStatus(isEnabled ? "enabled" : "disabled");
    } catch {
      setNotifListenerStatus("disabled");
    }
  }, []);

  useEffect(() => {
    void checkStatus();
    const sub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          void checkStatus();
        }
      },
    );
    return () => sub.remove();
  }, [checkStatus]);

  const handleToggle = async (val: boolean) => {
    await Haptics.selectionAsync();
    setAutoTrackEnabled(val);
    await updateQuickAddSettings({ upiDetectionTrigger: val });
  };

  const handleOpenSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "android") {
      try {
        await NativeModules.PocketflowQuickAdd?.openNotificationListenerSettings();
      } catch {
        // Fallback
      }
    }
  };

  const isFullyActive = autoTrackEnabled && notifListenerStatus === "enabled";

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Navigation Header */}
      <View style={[styles.navBar, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceRecessed }]}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={colors.fg} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.fg }]}>
          Smart Auto-Track
        </Text>
        <View
          style={[
            styles.privacyBadge,
            {
              backgroundColor: isDark
                ? "rgba(184, 243, 107, 0.12)"
                : "rgba(16, 28, 61, 0.08)",
            },
          ]}
        >
          <Feather name="shield" size={12} color={colors.primary} />
          <Text style={[styles.privacyBadgeText, { color: colors.primary }]}>
            On-Device
          </Text>
        </View>
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
        {/* Main Status & Toggle Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark
                ? colors.surface
                : colors.surfaceElevated || "#F8F9FB",
              borderColor: isFullyActive
                ? `${colors.primary}40`
                : colors.border,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isFullyActive
                      ? colors.success || "#10B981"
                      : notifListenerStatus === "enabled"
                        ? colors.fgMuted
                        : "#F59E0B",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusLabel,
                  {
                    color: isFullyActive
                      ? colors.success || "#10B981"
                      : notifListenerStatus === "enabled"
                        ? colors.fgMuted
                        : "#F59E0B",
                  },
                ]}
              >
                {isFullyActive
                  ? "Active & Detecting"
                  : notifListenerStatus === "enabled"
                    ? "Paused"
                    : "Setup Required"}
              </Text>
            </View>

            <Pressable
              onPress={() => void handleToggle(!autoTrackEnabled)}
              style={[
                styles.togglePill,
                {
                  backgroundColor: autoTrackEnabled
                    ? colors.primary
                    : colors.surfaceRecessed,
                },
              ]}
              hitSlop={8}
            >
              <View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: autoTrackEnabled
                      ? colors.onPrimary
                      : colors.fgMuted,
                    alignSelf: autoTrackEnabled ? "flex-end" : "flex-start",
                  },
                ]}
              />
            </Pressable>
          </View>

          <Text style={[styles.heroHeadline, { color: colors.fg }]}>
            Zero-Touch Expense Logging
          </Text>
          <Text style={[styles.heroSub, { color: colors.fgMuted }]}>
            Zeno detects payments from UPI and bank notifications in real time.
            Transactions are categorized instantly without manual entry.
          </Text>

          {notifListenerStatus !== "enabled" ? (
            <Pressable
              onPress={() => void handleOpenSettings()}
              style={[styles.primaryCta, { backgroundColor: colors.primary }]}
            >
              <Feather name="bell" size={16} color={colors.onPrimary} />
              <Text
                style={[styles.primaryCtaText, { color: colors.onPrimary }]}
              >
                Enable Notification Access
              </Text>
              <Feather name="arrow-right" size={16} color={colors.onPrimary} />
            </Pressable>
          ) : (
            <View
              style={[
                styles.readyBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(184, 243, 107, 0.08)"
                    : "rgba(16, 28, 61, 0.05)",
                },
              ]}
            >
              <Feather name="check-circle" size={15} color={colors.primary} />
              <Text style={[styles.readyBannerText, { color: colors.fg }]}>
                Listener active • Ready to track payments
              </Text>
            </View>
          )}
        </View>

        {/* Compact Dedicated Page Link: Learned Merchant Rules */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            MERCHANT MEMORY
          </Text>

          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/merchant-rules" as never);
            }}
            style={({ pressed }) => [
              styles.compactRulesCard,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.surfaceElevated || "#F8F9FB",
                borderColor: colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View
              style={[
                styles.compactIconWrap,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Feather name="bookmark" size={17} color={colors.primary} />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.rulesCardTitleRow}>
                <Text style={[styles.compactRulesTitle, { color: colors.fg }]}>
                  Learned Merchant Rules
                </Text>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Text style={[styles.countPillText, { color: colors.primary }]}>
                    {merchantRules.length}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.compactRulesSub, { color: colors.fgMuted }]}
                numberOfLines={1}
              >
                {merchantRules.length === 0
                  ? "Tap to view automatic categorization memory"
                  : `${merchantRules.length} active rule${merchantRules.length === 1 ? "" : "s"} • Tap to manage`}
              </Text>
            </View>

            <Feather name="chevron-right" size={16} color={colors.fgSubtle} />
          </Pressable>
        </View>

        {/* Minimal: How It Works */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            HOW IT WORKS
          </Text>

          <View
            style={[
              styles.howItWorksCard,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.surfaceElevated || "#F8F9FB",
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepIconBubble,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="credit-card" size={16} color={colors.primary} />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepTitle, { color: colors.fg }]}>
                  1. You make a payment
                </Text>
                <Text
                  style={[styles.stepDescription, { color: colors.fgMuted }]}
                >
                  Pay via any UPI app or receive a bank SMS.
                </Text>
              </View>
            </View>

            <View
              style={[styles.stepDivider, { backgroundColor: colors.border }]}
            />

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepIconBubble,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="cpu" size={16} color={colors.primary} />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepTitle, { color: colors.fg }]}>
                  2. Zeno auto-detects locally
                </Text>
                <Text
                  style={[styles.stepDescription, { color: colors.fgMuted }]}
                >
                  Amount, merchant & bank are extracted on-device.
                </Text>
              </View>
            </View>

            <View
              style={[styles.stepDivider, { backgroundColor: colors.border }]}
            />

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepIconBubble,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="check" size={16} color={colors.primary} />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepTitle, { color: colors.fg }]}>
                  3. Instant 1-tap categorization
                </Text>
                <Text
                  style={[styles.stepDescription, { color: colors.fgMuted }]}
                >
                  Quick Add pre-fills details. Known merchants auto-save.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Minimal: Permissions */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            PERMISSIONS
          </Text>

          <View
            style={[
              styles.reqCard,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.surfaceElevated || "#F8F9FB",
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => void handleOpenSettings()}
              style={styles.reqRow}
            >
              <Feather
                name={
                  notifListenerStatus === "enabled"
                    ? "check-circle"
                    : "alert-circle"
                }
                size={18}
                color={
                  notifListenerStatus === "enabled"
                    ? colors.success || "#10B981"
                    : "#F59E0B"
                }
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reqTitle, { color: colors.fg }]}>
                  Notification Access
                </Text>
                <Text style={[styles.reqSub, { color: colors.fgMuted }]}>
                  {notifListenerStatus === "enabled"
                    ? "Enabled and listening for payment alerts"
                    : "Tap to grant in Android Settings"}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.fgSubtle} />
            </Pressable>

            <View
              style={[styles.reqDivider, { backgroundColor: colors.border }]}
            />

            <View style={styles.reqRow}>
              <Feather
                name="shield"
                size={18}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reqTitle, { color: colors.fg }]}>
                  Zero SMS Read Permission
                </Text>
                <Text style={[styles.reqSub, { color: colors.fgMuted }]}>
                  Listens to notification popups only. Never reads SMS inbox.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Supported Apps Chips */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            SUPPORTED APPS & BANKS
          </Text>
          <View style={styles.appsRow}>
            {[
              "Google Pay",
              "PhonePe",
              "Paytm",
              "CRED",
              "Amazon Pay",
              "HDFC",
              "SBI",
              "ICICI",
              "Axis",
              "Bank SMS",
            ].map((app) => (
              <View
                key={app}
                style={[
                  styles.appChip,
                  {
                    backgroundColor: isDark
                      ? colors.surface
                      : colors.surfaceElevated || "#F8F9FB",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="check" size={11} color={colors.primary} />
                <Text style={[styles.appChipText, { color: colors.fg }]}>
                  {app}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 100% On-Device Privacy Guarantee Callout */}
        <View
          style={[
            styles.privacyBox,
            {
              backgroundColor: isDark
                ? "rgba(184, 243, 107, 0.05)"
                : "rgba(16, 28, 61, 0.04)",
              borderColor: isDark ? "rgba(184, 243, 107, 0.15)" : colors.border,
            },
          ]}
        >
          <Feather name="lock" size={16} color={colors.primary} />
          <Text style={[styles.privacyBoxText, { color: colors.fgMuted }]}>
            100% On-Device Privacy: Parsing and merchant memory run entirely on
            your phone. No transactions or SMS data ever leave your device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  privacyBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  statusIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  heroHeadline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  primaryCtaText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  readyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  readyBannerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  sectionWrap: {
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  // Compact Merchant Rules Card
  compactRulesCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  compactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rulesCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactRulesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  compactRulesSub: {
    fontSize: fontSize.xs,
  },
  howItWorksCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[3],
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  stepIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepTextWrap: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  stepDescription: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  stepDivider: {
    height: 1,
    marginLeft: 44,
  },
  reqCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[3],
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  reqTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  reqSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  reqDivider: {
    height: 1,
  },
  appsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  appChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  appChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  privacyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing[1],
  },
  privacyBoxText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
});
