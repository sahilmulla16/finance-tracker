import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { spacing, radius, fontWeight } from "@/constants/tokens";
import { MascotGuide } from "@/components/MascotGuide";
import { useColors } from "@/hooks/useColors";
import { requestNotificationPermission } from "@/services/notifications/notificationService";
import {
  saveNotificationPreferences,
  getNotificationPreferences,
} from "@/services/notifications/notificationScheduler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface NotificationOnboardingStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * Screen 3 of 7: Notifications
 * Title: "Stay on top of your money."
 * Subtitle: "Get budget alerts and daily spending summaries so nothing slips by."
 * Primary CTA: "Allow notifications" | Secondary: "Maybe later"
 */
export function NotificationOnboardingStep({
  onContinue,
  onSkip,
}: NotificationOnboardingStepProps) {
  const [requesting, setRequesting] = useState(false);
  const colors = useColors();
  const isDark = colors.isDark;

  const handleTurnOn = async () => {
    if (requesting) return;
    setRequesting(true);
    void Haptics.selectionAsync();

    try {
      const granted = await requestNotificationPermission();
      const currentPrefs = await getNotificationPreferences();
      await saveNotificationPreferences({
        ...currentPrefs,
        enabled: granted,
        budget80Alerts: true,
        budget100Alerts: true,
        dailySummaryEnabled: true,
        monthlySummaryEnabled: true,
        weeklyInsightsEnabled: true,
      });

      if (granted) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (err) {
      console.warn("[NotificationOnboarding] Permission request error:", err);
    } finally {
      setRequesting(false);
      onContinue();
    }
  };

  const handleSkip = () => {
    void Haptics.selectionAsync();
    onSkip();
  };

  return (
    <View style={styles.container}>
      {/* Illustration Zone (~50% of screen) */}
      <View style={styles.illustrationZone}>
        {/* Mint-Green Soft Radial Ambient Aura Glow */}
        <View
          style={[
            styles.radialGlow,
            {
              backgroundColor: isDark
                ? "rgba(61, 220, 151, 0.16)"
                : "rgba(61, 220, 151, 0.10)",
            },
          ]}
        />

        {/* Mascot Area with Sparkle Dashes & Ringing Bell */}
        <View style={styles.mascotWrapper}>
          {/* Mint Sparkle Capsule Strokes around head */}
          <View style={[styles.sparkleDash, styles.sparkleTopLeft]} />
          <View style={[styles.sparkleDash, styles.sparkleTopRight]} />
          <View style={[styles.sparkleDash, styles.sparkleFarRight]} />

          {/* Centered Mint Cloud Mascot */}
          <MascotGuide mascot="joyful" size={150} floating glow={false} />

          {/* Ringing Bell in Primary Color with Motion Dashes */}
          <View style={styles.ringingBellContainer}>
            <View
              style={[
                styles.ringingBellBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name="bell"
                size={14}
                color={colors.onPrimary}
              />
            </View>
            {/* Motion dashes showing ringing */}
            <View style={styles.motionDashes}>
              <View style={[styles.motionArc, { borderColor: colors.primary }]} />
              <View style={[styles.motionArcOuter, { borderColor: colors.primary }]} />
            </View>
          </View>
        </View>

        {/* Floating Stacked Glass Notification Cards */}
        <View style={styles.cardsStackContainer}>
          {/* Blurred Depth Glass Bell Tile in background */}
          <View
            style={[
              styles.depthBackdropTile,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "rgba(255, 255, 255, 0.4)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(14, 22, 51, 0.06)",
              },
            ]}
          >
            <Feather
              name="bell"
              size={24}
              color={isDark ? "rgba(61, 220, 151, 0.4)" : "rgba(16, 32, 107, 0.25)"}
            />
          </View>

          {/* Back Card: "Daily summary" (Faded with depth blur) */}
          <View
            style={[
              styles.backGlassCard,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(255, 255, 255, 0.6)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.09)"
                  : "rgba(14, 22, 51, 0.06)",
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: "rgba(61, 220, 151, 0.15)" },
                ]}
              >
                <Feather name="bar-chart-2" size={14} color="#3DDC97" />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text
                  style={[
                    styles.cardTitleText,
                    { color: isDark ? "#FFFFFF" : "#0E1633" },
                  ]}
                >
                  Daily summary
                </Text>
                <Text
                  style={[
                    styles.cardTimestampText,
                    { color: isDark ? "#9AA5A0" : "#5B6575" },
                  ]}
                >
                  9:00 PM
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.cardBodyText,
                { color: isDark ? "#9AA5A0" : "#5B6575" },
              ]}
              numberOfLines={1}
            >
              You spent ₹840 today across 5 expenses
            </Text>
          </View>

          {/* Front Card: "Budget alert" (Brighter with orange warning & progress bar) */}
          <View
            style={[
              styles.frontGlassCard,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(255, 255, 255, 0.88)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.14)"
                  : "rgba(14, 22, 51, 0.08)",
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: "rgba(245, 158, 11, 0.16)" },
                ]}
              >
                <Feather name="alert-triangle" size={14} color="#F59E0B" />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text
                  style={[
                    styles.cardTitleText,
                    { color: isDark ? "#FFFFFF" : "#0E1633" },
                  ]}
                >
                  Budget alert
                </Text>
                <Text
                  style={[
                    styles.cardTimestampText,
                    { color: isDark ? "#9AA5A0" : "#5B6575" },
                  ]}
                >
                  now
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.cardBodyText,
                { color: isDark ? "#9AA5A0" : "#5B6575" },
              ]}
            >
              You've used 80% of your Food budget
            </Text>

            {/* Thin Progress Bar: 80% filled in orange */}
            <View
              style={[
                styles.progressBarTrack,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(14, 22, 51, 0.08)",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: "80%", backgroundColor: "#F59E0B" },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Typography Zone */}
      <View style={styles.textZone}>
        <Text
          style={[
            styles.titleText,
            { color: isDark ? "#FFFFFF" : "#0E1633" },
          ]}
        >
          Stay on top of your money.
        </Text>
        <Text
          style={[
            styles.subtitleText,
            { color: isDark ? "#9AA5A0" : "#5B6575" },
          ]}
        >
          Get budget alerts and daily spending summaries so nothing slips by.
        </Text>
      </View>

      {/* Bottom CTA Zone */}
      <View style={styles.bottomCtaZone}>
        <Pressable
          onPress={handleTurnOn}
          disabled={requesting}
          style={({ pressed }) => [
            styles.primaryCtaPill,
            {
              backgroundColor: colors.primary,
              opacity: requesting ? 0.7 : pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Allow notifications"
        >
          <Text
            style={[
              styles.primaryCtaText,
              { color: colors.onPrimary },
            ]}
          >
            {requesting ? "Allowing..." : "Allow notifications"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={styles.secondaryActionBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
        >
          <Text
            style={[
              styles.secondaryActionText,
              { color: isDark ? "#9AA5A0" : "#5B6575" },
            ]}
          >
            Maybe later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  illustrationZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[1],
    position: "relative",
  },
  radialGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 0,
    alignSelf: "center",
  },
  mascotWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 190,
    height: 145,
    zIndex: 2,
  },
  sparkleDash: {
    position: "absolute",
    width: 3.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#3DDC97",
    opacity: 0.9,
  },
  sparkleTopLeft: {
    top: 10,
    left: 20,
    transform: [{ rotate: "-28deg" }],
  },
  sparkleTopRight: {
    top: 6,
    right: 28,
    transform: [{ rotate: "32deg" }],
  },
  sparkleFarRight: {
    top: 42,
    right: 8,
    transform: [{ rotate: "55deg" }],
  },
  ringingBellContainer: {
    position: "absolute",
    right: 18,
    top: 55,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 4,
  },
  ringingBellBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  motionDashes: {
    marginLeft: 3,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  motionArc: {
    width: 6,
    height: 10,
    borderRightWidth: 1.5,
    borderRadius: 5,
    marginBottom: 2,
  },
  motionArcOuter: {
    width: 9,
    height: 14,
    borderRightWidth: 1.5,
    borderRadius: 7,
    position: "absolute",
    left: 3,
  },
  cardsStackContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 335),
    marginTop: -16,
    position: "relative",
    zIndex: 1,
    transform: [{ rotate: "-2.5deg" }],
  },
  depthBackdropTile: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    top: -12,
    right: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  backGlassCard: {
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: -18,
    transform: [{ scale: 0.94 }],
    alignSelf: "center",
    width: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  frontGlassCard: {
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardHeaderTextGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
  cardTimestampText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },
  cardBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  textZone: {
    paddingHorizontal: spacing[2],
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  titleText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: spacing[2],
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: fontWeight.normal,
  },
  bottomCtaZone: {
    paddingTop: spacing[2],
    alignItems: "center",
  },
  primaryCtaPill: {
    height: 56,
    width: "100%",
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  secondaryActionBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
});
