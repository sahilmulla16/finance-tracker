import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  NativeModules,
  AppState,
  AppStateStatus,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { spacing, radius, fontWeight } from "@/constants/tokens";
import { MascotGuide } from "@/components/MascotGuide";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SmartAutoTrackOnboardingStepProps {
  onContinue: () => void;
  onSkip: () => void;
  onOpenTutorial?: () => void;
}

/**
 * Authentic Swiggy pin emblem icon
 */
function SwiggyPinIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.15 11.58 7.46 11.85a.8.8 0 0 0 1.08 0C12.85 21.58 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11.2c-1.77 0-3.2-1.43-3.2-3.2 0-1.77 1.43-3.2 3.2-3.2s3.2 1.43 3.2 3.2c0 1.77-1.43 3.2-3.2 3.2z"
        fill="#FFFFFF"
      />
      <Path
        d="M10.8 8.8c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2c0 .4-.2.76-.5.98l-1.4 1.04c-.3.22-.5.58-.5.98 0 .66.54 1.2 1.2 1.2s1.2-.54 1.2-1.2"
        stroke="#FC8019"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Authentic Zomato italic typography wordmark
 */
function ZomatoEmblem({ size = 26 }: { size?: number }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 9.5,
          fontWeight: "900",
          fontStyle: "italic",
          letterSpacing: -0.4,
        }}
      >
        zomato
      </Text>
    </View>
  );
}

/**
 * Authentic Amazon 'a' with smile arrow
 */
function AmazonSmileIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", lineHeight: 14 }}>
        a
      </Text>
      <Svg width={14} height={6} viewBox="0 0 16 6" fill="none" style={{ marginTop: -1 }}>
        <Path
          d="M1 1C5 5 11 5 15 1"
          stroke="#FF9900"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M13 1L15 1.5L14 3"
          stroke="#FF9900"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/**
 * Screen 5 of 7: Smart Auto Track
 * Title: "Your expenses, tracked smarter."
 * Subtitle: "Let Zeno keep track of your spending so you can focus on what matters."
 * Primary CTA: "Set up Smart Track" | Secondary: "Not now"
 */
export function SmartAutoTrackOnboardingStep({
  onContinue,
  onSkip,
  onOpenTutorial,
}: SmartAutoTrackOnboardingStepProps) {
  const colors = useColors();
  const isDark = colors.isDark;
  const { updateQuickAddSettings } = useFinance();

  const accentColor = isDark ? "#3DDC97" : colors.primary;

  const [listenerStatus, setListenerStatus] = useState<
    "checking" | "enabled" | "disabled"
  >("checking");
  const [waitingForSettingsReturn, setWaitingForSettingsReturn] =
    useState(false);

  const checkAccessStatus = useCallback(async () => {
    if (Platform.OS !== "android") {
      setListenerStatus("disabled");
      return false;
    }
    try {
      const isEnabled =
        await NativeModules.PocketflowQuickAdd?.isNotificationListenerEnabled();
      const status = isEnabled ? "enabled" : "disabled";
      setListenerStatus(status);
      return isEnabled;
    } catch {
      setListenerStatus("disabled");
      return false;
    }
  }, []);

  useEffect(() => {
    void checkAccessStatus();

    const sub = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (nextState === "active") {
          const isEnabled = await checkAccessStatus();
          if (isEnabled && waitingForSettingsReturn) {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            await updateQuickAddSettings({ upiDetectionTrigger: true });
            setWaitingForSettingsReturn(false);
            onContinue();
          }
        }
      },
    );

    return () => sub.remove();
  }, [
    checkAccessStatus,
    waitingForSettingsReturn,
    onContinue,
    updateQuickAddSettings,
  ]);

  const handleEnableAutoTrack = async () => {
    void Haptics.selectionAsync();

    if (Platform.OS !== "android") {
      onContinue();
      return;
    }

    const isAlreadyEnabled = await checkAccessStatus();
    if (isAlreadyEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateQuickAddSettings({ upiDetectionTrigger: true });
      onContinue();
      return;
    }

    if (onOpenTutorial) {
      onOpenTutorial();
      return;
    }

    try {
      setWaitingForSettingsReturn(true);
      await NativeModules.PocketflowQuickAdd?.openNotificationListenerSettings();
    } catch {
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
        {/* Soft Ambient Radial Glow */}
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: isDark
                ? "rgba(61, 220, 151, 0.16)"
                : "rgba(16, 28, 61, 0.06)",
            },
          ]}
        />

        {/* Mascot at top center winking & smiling */}
        <View style={styles.mascotTopWrapper}>
          {/* Sparkle Dashes */}
          <View
            style={[
              styles.sparkleDash,
              styles.sparkleTopLeft,
              { backgroundColor: accentColor },
            ]}
          />
          <View
            style={[
              styles.sparkleDash,
              styles.sparkleTopRight,
              { backgroundColor: accentColor },
            ]}
          />
          <View
            style={[
              styles.sparkleDash,
              styles.sparkleMidRight,
              { backgroundColor: accentColor },
            ]}
          />

          <MascotGuide mascot="winking" size={130} floating={false} glow={false} />
        </View>

        {/* Incoming Notification Glass Card */}
        <View style={styles.notifCardWrapper}>
          <View
            style={[
              styles.notificationGlassCard,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.94)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.16)"
                  : "rgba(16, 28, 61, 0.10)",
              },
            ]}
          >
            {/* Authentic Swiggy Orange Tile in Notification */}
            <View style={[styles.notifIconBox, { backgroundColor: "#FC8019" }]}>
              <SwiggyPinIcon size={16} />
            </View>
            <View style={styles.notifBodyColumn}>
              <View style={styles.notifHeaderRow}>
                <Text
                  style={[
                    styles.notifMerchantTitle,
                    { color: isDark ? "#FFFFFF" : "#101C3D" },
                  ]}
                >
                  Swiggy
                </Text>
                <Text
                  style={[
                    styles.notifTimeTag,
                    { color: isDark ? "#9AA5A0" : "#5B6575" },
                  ]}
                >
                  now
                </Text>
              </View>
              <Text
                style={[
                  styles.notifMessageText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Payment of ₹320 at Swiggy
              </Text>
            </View>
          </View>
        </View>

        {/* Thin Curved Arrow from notification down to transaction list */}
        <View style={styles.curvedArrowWrap}>
          <Svg width={36} height={32} viewBox="0 0 40 36" fill="none">
            <Path
              d="M30 4 C 30 18, 14 20, 8 28"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
            <Path
              d="M4 22 L8 29 L15 26"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Stacked Transaction List of 3 Glass Rows with Depth Fade */}
        <View style={styles.transactionsStackWrapper}>
          {/* Row 1: Swiggy with Authentic Orange Swiggy Pin Logo */}
          <View
            style={[
              styles.transactionGlassRow,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(255, 255, 255, 0.92)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.14)"
                  : "rgba(16, 28, 61, 0.09)",
                zIndex: 3,
              },
            ]}
          >
            <View
              style={[
                styles.txIconSquare,
                { backgroundColor: "#FC8019" },
              ]}
            >
              <SwiggyPinIcon size={18} />
            </View>
            <View style={styles.txInfoCol}>
              <Text
                style={[
                  styles.txMerchantText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                Swiggy
              </Text>
              <Text
                style={[
                  styles.txCategoryText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Food & Dining
              </Text>
            </View>
            <View style={styles.txAmountCol}>
              <Text
                style={[
                  styles.txAmountText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                -₹320
              </Text>
              <Text
                style={[
                  styles.txTimeText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Today, 8:14 PM
              </Text>
            </View>
          </View>

          {/* Row 2: Zomato with Authentic Crimson Zomato Logo */}
          <View
            style={[
              styles.transactionGlassRow,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.72)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.10)"
                  : "rgba(16, 28, 61, 0.07)",
                opacity: 0.78,
                transform: [{ scale: 0.97 }],
                marginTop: -4,
                zIndex: 2,
              },
            ]}
          >
            <View
              style={[
                styles.txIconSquare,
                { backgroundColor: "#E23744" },
              ]}
            >
              <ZomatoEmblem size={26} />
            </View>
            <View style={styles.txInfoCol}>
              <Text
                style={[
                  styles.txMerchantText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                Zomato
              </Text>
              <Text
                style={[
                  styles.txCategoryText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Food & Dining
              </Text>
            </View>
            <View style={styles.txAmountCol}>
              <Text
                style={[
                  styles.txAmountText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                -₹450
              </Text>
              <Text
                style={[
                  styles.txTimeText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Yesterday
              </Text>
            </View>
          </View>

          {/* Row 3: Amazon with Authentic Dark Amazon Smile Logo */}
          <View
            style={[
              styles.transactionGlassRow,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "rgba(255, 255, 255, 0.52)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(16, 28, 61, 0.05)",
                opacity: 0.55,
                transform: [{ scale: 0.94 }],
                marginTop: -4,
                zIndex: 1,
              },
            ]}
          >
            <View
              style={[
                styles.txIconSquare,
                { backgroundColor: "#131921" },
              ]}
            >
              <AmazonSmileIcon size={20} />
            </View>
            <View style={styles.txInfoCol}>
              <Text
                style={[
                  styles.txMerchantText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                Amazon
              </Text>
              <Text
                style={[
                  styles.txCategoryText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                Shopping
              </Text>
            </View>
            <View style={styles.txAmountCol}>
              <Text
                style={[
                  styles.txAmountText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                -₹1,299
              </Text>
              <Text
                style={[
                  styles.txTimeText,
                  { color: isDark ? "#9AA5A0" : "#5B6575" },
                ]}
              >
                2 days ago
              </Text>
            </View>
          </View>

          {/* Overlapping Bottom Badge: "Automatically tracked" */}
          <View style={styles.badgeAnchorRow}>
            <View
              style={[
                styles.trackedVerifiedBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(61, 220, 151, 0.14)"
                    : "rgba(16, 28, 61, 0.08)",
                  borderColor: isDark
                    ? "rgba(61, 220, 151, 0.35)"
                    : "rgba(16, 28, 61, 0.18)",
                },
              ]}
            >
              <View
                style={[
                  styles.checkCircleMini,
                  { backgroundColor: accentColor },
                ]}
              >
                <Feather
                  name="check"
                  size={11}
                  color={isDark ? "#0A0E0D" : "#FFFFFF"}
                />
              </View>
              <Text
                style={[
                  styles.trackedBadgeText,
                  { color: accentColor },
                ]}
              >
                Automatically tracked
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Typography Zone */}
      <View style={styles.textZone}>
        <Text
          style={[
            styles.titleText,
            { color: isDark ? "#FFFFFF" : "#101C3D" },
          ]}
        >
          Your expenses, tracked smarter.
        </Text>
        <Text
          style={[
            styles.subtitleText,
            { color: isDark ? "#9AA5A0" : "#5B6575" },
          ]}
        >
          Let Zeno keep track of your spending so you can focus on what matters.
        </Text>
      </View>

      {/* Bottom CTA Zone */}
      <View style={styles.bottomCtaZone}>
        <Pressable
          onPress={handleEnableAutoTrack}
          style={({ pressed }) => [
            styles.primaryCtaPill,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Set up Smart Track"
        >
          <Text
            style={[
              styles.primaryCtaText,
              { color: colors.onPrimary },
            ]}
          >
            Set up Smart Track
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={styles.secondaryActionBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text
            style={[
              styles.secondaryActionText,
              { color: isDark ? "#9AA5A0" : "#5B6575" },
            ]}
          >
            Not now
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
  ambientGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 10,
    alignSelf: "center",
  },
  mascotTopWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    width: 170,
    height: 94,
    marginBottom: -34,
    zIndex: 5,
  },
  sparkleDash: {
    position: "absolute",
    width: 3.5,
    height: 12,
    borderRadius: 2,
    opacity: 0.9,
  },
  sparkleTopLeft: {
    top: 12,
    left: 14,
    transform: [{ rotate: "-28deg" }],
  },
  sparkleTopRight: {
    top: 10,
    right: 18,
    transform: [{ rotate: "32deg" }],
  },
  sparkleMidRight: {
    top: 34,
    right: 6,
    transform: [{ rotate: "50deg" }],
  },
  notifCardWrapper: {
    width: Math.min(SCREEN_WIDTH - 48, 335),
    zIndex: 4,
    marginTop: 0,
  },
  notificationGlassCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  notifBodyColumn: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  notifMerchantTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  notifTimeTag: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  notifMessageText: {
    fontSize: 12,
    fontWeight: fontWeight.normal,
  },
  curvedArrowWrap: {
    alignSelf: "flex-end",
    marginRight: 32,
    marginVertical: -2,
    zIndex: 5,
  },
  transactionsStackWrapper: {
    width: Math.min(SCREEN_WIDTH - 48, 335),
    position: "relative",
    zIndex: 2,
  },
  transactionGlassRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  txIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  txInfoCol: {
    flex: 1,
  },
  txMerchantText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    marginBottom: 1,
  },
  txCategoryText: {
    fontSize: 11,
    fontWeight: fontWeight.normal,
  },
  txAmountCol: {
    alignItems: "flex-end",
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    marginBottom: 1,
  },
  txTimeText: {
    fontSize: 10.5,
    fontWeight: fontWeight.normal,
  },
  badgeAnchorRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 2,
    zIndex: 6,
  },
  trackedVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  checkCircleMini: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  trackedBadgeText: {
    fontSize: 11.5,
    fontWeight: fontWeight.bold,
  },
  textZone: {
    alignItems: "center",
    paddingHorizontal: spacing[3],
    marginVertical: spacing[3],
  },
  titleText: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: spacing[2],
    lineHeight: 32,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 310,
  },
  bottomCtaZone: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
    alignItems: "center",
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  primaryCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    borderRadius: radius.full,
  },
  primaryCtaText: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  secondaryActionBtn: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
  },
  secondaryActionText: {
    fontSize: 13.5,
    fontWeight: fontWeight.semibold,
  },
});
