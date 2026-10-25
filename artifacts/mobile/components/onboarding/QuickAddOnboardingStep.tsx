import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { spacing, radius, fontWeight } from "@/constants/tokens";
import { MascotGuide } from "@/components/MascotGuide";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface QuickAddOnboardingStepProps {
  onContinue: () => void;
  onSkip: () => void;
  onOpenAccessibilityDisclosure?: () => void;
  onOpenTutorial?: () => void;
  a11yEnabled?: boolean;
}

/**
 * Screen 4 of 7: Quick Add
 * Title: "Add an expense in seconds."
 * Subtitle: "Press Volume Down twice to open Quick Add and record an expense without navigating the app."
 * Primary CTA: "Set up Quick Add" | Secondary: "Maybe later"
 */
export function QuickAddOnboardingStep({
  onContinue,
  onSkip,
  onOpenAccessibilityDisclosure,
  onOpenTutorial,
  a11yEnabled = false,
}: QuickAddOnboardingStepProps) {
  const colors = useColors();
  const isDark = colors.isDark;

  const accentColor = isDark ? "#3DDC97" : colors.primary;

  const handleCta = () => {
    void Haptics.selectionAsync();
    if (!a11yEnabled && Platform.OS === "android") {
      if (onOpenAccessibilityDisclosure) {
        onOpenAccessibilityDisclosure();
      } else if (onOpenTutorial) {
        onOpenTutorial();
      } else {
        onContinue();
      }
    } else {
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
                ? "rgba(61, 220, 151, 0.15)"
                : "rgba(16, 28, 61, 0.05)",
            },
          ]}
        />

        {/* Outer Mobile Phone Screen Canvas Mockup Layer */}
        <View
          style={[
            styles.phoneDeviceShell,
            {
              backgroundColor: isDark ? "#0A0F0D" : "#E2E8F0",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.18)"
                : "rgba(16, 28, 61, 0.16)",
              shadowColor: isDark ? "#000" : "#101C3D",
            },
          ]}
        >
          {/* Left Edge Hardware Volume Controls */}
          <View style={styles.hardwareBezelColumn}>
            {/* Volume Up */}
            <View
              style={[
                styles.volumeKey,
                { backgroundColor: isDark ? "#28322C" : "#B2BDCB" },
              ]}
            />

            {/* Volume Down with Highlight & Radiating Acoustic Waves */}
            <View style={styles.volumeDownWrapper}>
              <View style={styles.rippleWavesAnchor}>
                <Svg width={36} height={46} viewBox="0 0 36 46" fill="none">
                  <Path
                    d="M30 14 C 22 18, 22 28, 30 32"
                    stroke={accentColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <Path
                    d="M24 8 C 12 14, 12 32, 24 38"
                    stroke={accentColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                  <Path
                    d="M18 2 C 2 10, 2 36, 18 44"
                    stroke={accentColor}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeDasharray="3 3"
                    opacity={0.35}
                  />
                </Svg>
              </View>

              <View
                style={[
                  styles.volumeKey,
                  styles.volumeKeyDown,
                  { backgroundColor: accentColor },
                ]}
              />
            </View>
          </View>

          {/* Phone Screen Display Surface */}
          <View
            style={[
              styles.phoneScreenSurface,
              { backgroundColor: isDark ? "#111815" : "#F4F7FB" },
            ]}
          >
            {/* Realistic Phone Status Bar */}
            <View style={styles.statusBarRow}>
              <Text
                style={[
                  styles.statusTimeText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                9:41
              </Text>
              <View
                style={[
                  styles.dynamicIslandPill,
                  { backgroundColor: isDark ? "#000000" : "#0E1633" },
                ]}
              >
                <View
                  style={[
                    styles.dynamicIslandLens,
                    { backgroundColor: isDark ? "#1C2420" : "#1A2238" },
                  ]}
                />
              </View>
              <View style={styles.statusIconsRow}>
                <Feather
                  name="wifi"
                  size={10}
                  color={isDark ? "#A0AEA6" : "#5B6575"}
                />
                <View
                  style={[
                    styles.miniBattery,
                    { borderColor: isDark ? "#A0AEA6" : "#5B6575" },
                  ]}
                >
                  <View
                    style={[
                      styles.miniBatteryFill,
                      { backgroundColor: accentColor },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Upper Action Callout & Mascot Row */}
            <View style={styles.phoneUpperRow}>
              {/* Glass Tooltip Pill: "Press Volume Down twice" */}
              <View
                style={[
                  styles.tooltipPill,
                  {
                    backgroundColor: isDark
                      ? "rgba(22, 30, 26, 0.96)"
                      : "rgba(255, 255, 255, 0.96)",
                    borderColor: isDark
                      ? "rgba(61, 220, 151, 0.35)"
                      : "rgba(16, 28, 61, 0.14)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.tooltipIconCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(61, 220, 151, 0.20)"
                        : "rgba(16, 28, 61, 0.08)",
                    },
                  ]}
                >
                  <Feather name="volume-2" size={12} color={accentColor} />
                </View>
                <View style={styles.tooltipTextWrap}>
                  <Text
                    style={[
                      styles.tooltipTitle,
                      { color: isDark ? "#FFFFFF" : "#101C3D" },
                    ]}
                  >
                    Press Volume Down
                  </Text>
                  <Text
                    style={[
                      styles.tooltipSubtitle,
                      { color: accentColor },
                    ]}
                  >
                    twice anywhere on phone
                  </Text>
                </View>
                <View
                  style={[
                    styles.tooltipMultiplierBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(61, 220, 151, 0.18)"
                        : "rgba(16, 28, 61, 0.08)",
                      borderColor: isDark
                        ? "rgba(61, 220, 151, 0.35)"
                        : "rgba(16, 28, 61, 0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tooltipMultiplierText,
                      { color: accentColor },
                    ]}
                  >
                    2×
                  </Text>
                </View>
              </View>

              {/* Mascot anchored prominently at top right */}
              <View style={styles.peekingMascotAnchor}>
                <View
                  style={[
                    styles.sparkleDash,
                    styles.mascotSparkleLeft,
                    { backgroundColor: accentColor },
                  ]}
                />
                <View
                  style={[
                    styles.sparkleDash,
                    styles.mascotSparkleRight,
                    { backgroundColor: accentColor },
                  ]}
                />
                <MascotGuide
                  mascot="peeking"
                  size={92}
                  floating={false}
                  glow={false}
                />
              </View>
            </View>

            {/* Connecting Guide Arrow */}
            <View style={styles.curvedArrowContainer} pointerEvents="none">
              <Svg width={36} height={30} viewBox="0 0 50 42" fill="none">
                <Path
                  d="M12 4 C 18 16, 24 24, 38 28"
                  stroke={accentColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
                <Path
                  d="M32 30 L40 28 L38 20"
                  stroke={accentColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Quick Add Floating Overlay Modal */}
            <View style={styles.cardCompositionWrapper}>
              <View
                style={[
                  styles.quickAddGlassCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(18, 25, 21, 0.95)"
                      : "rgba(255, 255, 255, 0.98)",
                    borderColor: isDark
                      ? "rgba(61, 220, 151, 0.28)"
                      : "rgba(16, 28, 61, 0.14)",
                  },
                ]}
              >
                {/* Modal Header */}
                <View style={styles.cardTopHeader}>
                  <View style={styles.headerLeftBadge}>
                    <View
                      style={[
                        styles.lightningIconWrap,
                        {
                          backgroundColor: isDark
                            ? "rgba(61, 220, 151, 0.2)"
                            : "rgba(16, 28, 61, 0.08)",
                        },
                      ]}
                    >
                      <Feather name="zap" size={11} color={accentColor} />
                    </View>
                    <Text
                      style={[
                        styles.cardHeaderTitle,
                        { color: isDark ? "#FFFFFF" : "#101C3D" },
                      ]}
                    >
                      Quick Add
                    </Text>
                  </View>
                  <Feather
                    name="x"
                    size={12}
                    color={isDark ? "#8A9791" : "#8E99A8"}
                  />
                </View>

                {/* Amount Row + Tactile Circle Confirm Button */}
                <View style={styles.cardInputRow}>
                  <View style={styles.amountWrap}>
                    <Text
                      style={[
                        styles.amountText,
                        { color: isDark ? "#FFFFFF" : "#101C3D" },
                      ]}
                    >
                      ₹250
                    </Text>
                    <View
                      style={[
                        styles.textCursor,
                        { backgroundColor: accentColor },
                      ]}
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={({ pressed }) => [
                      styles.circleConfirmBtn,
                      { backgroundColor: colors.primary },
                      pressed && { transform: [{ scale: 0.90 }], opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="circleConfirmBtn"
                  >
                    <Feather
                      name="check"
                      size={15}
                      color={colors.onPrimary}
                    />
                  </Pressable>
                </View>

                {/* Category Dropdown Chip with Tactile Press Feedback */}
                <View style={styles.categoryRow}>
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                    }}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(16, 28, 61, 0.06)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(16, 28, 61, 0.09)",
                      },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Category: Food"
                  >
                    <Feather
                      name="coffee"
                      size={11}
                      color={accentColor}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isDark ? "#FFFFFF" : "#101C3D" },
                      ]}
                    >
                      Food
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={12}
                      color={isDark ? "#9AA5A0" : "#5B6575"}
                      style={{ marginLeft: 5 }}
                    />
                  </Pressable>
                </View>

                {/* Bottom Meta Chips */}
                <View style={styles.bottomChipsRow}>
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                    }}
                    style={({ pressed }) => [
                      styles.metaChip,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(16, 28, 61, 0.04)",
                      },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                    ]}
                  >
                    <Feather
                      name="calendar"
                      size={10}
                      color={isDark ? "#9AA5A0" : "#5B6575"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.metaChipText,
                        { color: isDark ? "#9AA5A0" : "#5B6575" },
                      ]}
                    >
                      Today
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                    }}
                    style={({ pressed }) => [
                      styles.metaChip,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(16, 28, 61, 0.04)",
                      },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                    ]}
                  >
                    <Feather
                      name="edit-3"
                      size={10}
                      color={isDark ? "#9AA5A0" : "#5B6575"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.metaChipText,
                        { color: isDark ? "#9AA5A0" : "#5B6575" },
                      ]}
                    >
                      Add note
                    </Text>
                  </Pressable>
                </View>
              </View>
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
          Add an expense in seconds.
        </Text>
        <Text
          style={[
            styles.subtitleText,
            { color: isDark ? "#9AA5A0" : "#5B6575" },
          ]}
        >
          Press Volume Down twice to open Quick Add and record an expense without
          navigating the app.
        </Text>
      </View>

      {/* Bottom CTA Zone */}
      <View style={styles.bottomCtaZone}>
        <Pressable
          onPress={handleCta}
          style={({ pressed }) => [
            styles.primaryCtaPill,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Set up Quick Add"
        >
          <Text
            style={[
              styles.primaryCtaText,
              { color: colors.onPrimary },
            ]}
          >
            Set up Quick Add
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.secondaryActionBtn,
            pressed && { opacity: 0.55, transform: [{ scale: 0.98 }] },
          ]}
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
  ambientGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 10,
    alignSelf: "center",
  },
  phoneDeviceShell: {
    width: Math.min(SCREEN_WIDTH - 48, 305),
    height: 242,
    borderRadius: 28,
    borderWidth: 2,
    padding: 4,
    position: "relative",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  phoneScreenSurface: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingTop: 6,
    position: "relative",
  },
  statusBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 14,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  statusTimeText: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  dynamicIslandPill: {
    width: 38,
    height: 6,
    borderRadius: 3,
    position: "relative",
    justifyContent: "center",
  },
  dynamicIslandLens: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    position: "absolute",
    right: 5,
  },
  statusIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniBattery: {
    width: 13,
    height: 7,
    borderRadius: 2,
    borderWidth: 1,
    padding: 0.5,
    justifyContent: "center",
  },
  miniBatteryFill: {
    width: 8,
    height: 4,
    borderRadius: 1,
  },
  hardwareBezelColumn: {
    position: "absolute",
    left: -7,
    top: 32,
    gap: 10,
    zIndex: 6,
  },
  volumeKey: {
    width: 5,
    height: 22,
    borderRadius: 3,
  },
  volumeDownWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeKeyDown: {
    width: 6,
    height: 22,
    borderRadius: 3,
    shadowColor: "#3DDC97",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 4,
  },
  rippleWavesAnchor: {
    position: "absolute",
    right: 2,
    top: -12,
    zIndex: 7,
  },
  phoneUpperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
    height: 42,
    zIndex: 5,
  },
  tooltipPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: 0,
    marginTop: 2,
    zIndex: 5,
  },
  tooltipIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  tooltipTextWrap: {
    flexDirection: "column",
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  tooltipSubtitle: {
    fontSize: 8.5,
    fontWeight: fontWeight.medium,
  },
  tooltipMultiplierBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipMultiplierText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  peekingMascotAnchor: {
    position: "absolute",
    right: 0,
    top: -16,
    zIndex: 10,
    alignItems: "center",
  },
  sparkleDash: {
    position: "absolute",
    width: 3,
    height: 10,
    borderRadius: 2,
    opacity: 0.85,
  },
  mascotSparkleLeft: {
    top: 4,
    left: 4,
    transform: [{ rotate: "-26deg" }],
  },
  mascotSparkleRight: {
    top: 6,
    right: 4,
    transform: [{ rotate: "30deg" }],
  },
  curvedArrowContainer: {
    position: "absolute",
    left: 14,
    top: 48,
    zIndex: 4,
  },
  cardCompositionWrapper: {
    width: "100%",
    position: "relative",
    marginTop: 2,
    zIndex: 3,
  },
  quickAddGlassCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 5,
    zIndex: 2,
  },
  cardTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  lightningIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  cardInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountText: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  textCursor: {
    width: 2,
    height: 20,
    borderRadius: 1,
    marginLeft: 3,
  },
  circleConfirmBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 10.5,
    fontWeight: fontWeight.bold,
  },
  bottomChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  metaChipText: {
    fontSize: 9,
    fontWeight: fontWeight.medium,
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
