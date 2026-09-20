import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeIcon: string;
  title: string;
  description: string;
  visualType: "accounts" | "quickAdd" | "insights";
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "slide-1",
    badge: "Unified Overview",
    badgeIcon: "credit-card",
    title: "Everything in one place",
    description:
      "Consolidate your bank accounts, cash wallet, and UPI balances into a single dashboard. 100% offline, zero cloud servers.",
    visualType: "accounts",
  },
  {
    id: "slide-2",
    badge: "Hardware Shortcut",
    badgeIcon: "zap",
    title: "Log spends in 2 seconds",
    description:
      "Double-press Volume Down on Android anywhere to pop open the Quick Add floating logger without navigating through menus.",
    visualType: "quickAdd",
  },
  {
    id: "slide-3",
    badge: "Smart Clarity",
    badgeIcon: "trending-up",
    title: "Stay in full control",
    description:
      "Set personalized monthly budgets, watch savings goals grow, and gain deep visual insights into your cash flow.",
    visualType: "insights",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      router.push("/basic-setup" as never);
    }
  };

  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    void Haptics.selectionAsync();
    router.push("/basic-setup" as never);
  };

  const currentSlide = SLIDES[currentSlideIndex];

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Top Bar with Skip */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing[3],
            paddingHorizontal: spacing[5],
          },
        ]}
      >
        {currentSlideIndex > 0 ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.navIconButton,
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Previous slide"
          >
            <Feather name="arrow-left" size={18} color={colors.fg} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        {/* Progress indicator dots */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((slide, index) => {
            const isActive = index === currentSlideIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.indicatorDot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.divider,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[styles.skipText, { color: colors.fgMuted }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Slide Content */}
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + spacing[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Graphic Representation */}
        <View style={styles.visualContainer}>
          {currentSlide.visualType === "accounts" && (
            <View
              style={[
                styles.cardMockup,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.mockupHeader}>
                <View style={styles.mockupHeaderLeft}>
                  <Feather name="shield" size={16} color={colors.primary} />
                  <Text
                    style={[styles.mockupHeaderTitle, { color: colors.fg }]}
                  >
                    Local Vault
                  </Text>
                </View>
                <View
                  style={[
                    styles.mockupPill,
                    { backgroundColor: `${colors.income}20` },
                  ]}
                >
                  <Text
                    style={[styles.mockupPillText, { color: colors.income }]}
                  >
                    Encrypted
                  </Text>
                </View>
              </View>

              <View style={styles.mockupAccounts}>
                <View
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <View style={styles.accountItemLeft}>
                    <View
                      style={[
                        styles.accountIcon,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                    >
                      <Feather
                        name="credit-card"
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={[styles.accountName, { color: colors.fg }]}>
                        Bank Account
                      </Text>
                      <Text
                        style={[styles.accountSub, { color: colors.fgMuted }]}
                      >
                        Salary & Savings
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.accountBalance, { color: colors.fg }]}>
                    ₹84,250
                  </Text>
                </View>

                <View
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <View style={styles.accountItemLeft}>
                    <View
                      style={[
                        styles.accountIcon,
                        { backgroundColor: `${colors.income}18` },
                      ]}
                    >
                      <Feather
                        name="dollar-sign"
                        size={16}
                        color={colors.income}
                      />
                    </View>
                    <View>
                      <Text style={[styles.accountName, { color: colors.fg }]}>
                        Cash Wallet
                      </Text>
                      <Text
                        style={[styles.accountSub, { color: colors.fgMuted }]}
                      >
                        Daily expenses
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.accountBalance, { color: colors.fg }]}>
                    ₹4,800
                  </Text>
                </View>
              </View>
            </View>
          )}

          {currentSlide.visualType === "quickAdd" && (
            <View
              style={[
                styles.cardMockup,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.hudOverlay}>
                <View
                  style={[
                    styles.hardwareTriggerBadge,
                    {
                      backgroundColor: `${colors.income}20`,
                      borderColor: colors.income,
                    },
                  ]}
                >
                  <Feather name="volume-2" size={16} color={colors.income} />
                  <Text
                    style={[
                      styles.hardwareTriggerText,
                      { color: colors.income },
                    ]}
                  >
                    2× Volume Down Pressed
                  </Text>
                </View>

                <View
                  style={[
                    styles.hudSheet,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.hudSheetHeader}>
                    <Text style={[styles.hudLabel, { color: colors.fgMuted }]}>
                      Quick Log
                    </Text>
                    <Text style={[styles.hudAmount, { color: colors.fg }]}>
                      ₹280
                    </Text>
                  </View>
                  <View style={styles.hudTags}>
                    <View
                      style={[
                        styles.hudTag,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                    >
                      <Feather name="coffee" size={12} color={colors.primary} />
                      <Text
                        style={[styles.hudTagText, { color: colors.primary }]}
                      >
                        Coffee & Snacks
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.hudTag,
                        { backgroundColor: `${colors.fgMuted}18` },
                      ]}
                    >
                      <Text
                        style={[styles.hudTagText, { color: colors.fgMuted }]}
                      >
                        UPI
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentSlide.visualType === "insights" && (
            <View
              style={[
                styles.cardMockup,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.insightsCard}>
                <View style={styles.insightStatRow}>
                  <View>
                    <Text
                      style={[
                        styles.insightStatLabel,
                        { color: colors.fgMuted },
                      ]}
                    >
                      Monthly Saved
                    </Text>
                    <Text
                      style={[
                        styles.insightStatValue,
                        { color: colors.income },
                      ]}
                    >
                      +₹24,500
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.targetCircle,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Feather name="target" size={24} color={colors.primary} />
                  </View>
                </View>

                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarLabels}>
                    <Text
                      style={[styles.progressLabel, { color: colors.fgMuted }]}
                    >
                      Emergency Fund Goal
                    </Text>
                    <Text
                      style={[styles.progressPct, { color: colors.primary }]}
                    >
                      75%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colors.divider },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: "75%" },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: `${colors.primary}16` },
            ]}
          >
            <Feather
              name={currentSlide.badgeIcon as never}
              size={13}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {currentSlide.badge}
            </Text>
          </View>

          <Text style={[styles.slideTitle, { color: colors.fg }]}>
            {currentSlide.title}
          </Text>
          <Text style={[styles.slideDesc, { color: colors.fgMuted }]}>
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Next Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            currentSlideIndex === SLIDES.length - 1
              ? "Continue to setup"
              : "Next slide"
          }
        >
          <Text style={[styles.nextButtonText, { color: colors.onPrimary }]}>
            {currentSlideIndex === SLIDES.length - 1
              ? "Set up your currency"
              : "Continue"}
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color={colors.onPrimary}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicatorDot: {
    height: 8,
    borderRadius: radius.full,
  },
  skipButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  skipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
    paddingTop: spacing[4],
  },
  visualContainer: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[4],
  },
  cardMockup: {
    width: "100%",
    padding: spacing[5],
    borderRadius: radius.hero,
    borderWidth: 1,
  },
  mockupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  mockupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  mockupHeaderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  mockupPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  mockupPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  mockupAccounts: {
    gap: spacing[3],
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  accountItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  accountSub: {
    fontSize: fontSize.xs,
  },
  accountBalance: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  hudOverlay: {
    gap: spacing[3],
  },
  hardwareTriggerBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  hardwareTriggerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  hudSheet: {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  hudSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  hudLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  hudAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  hudTags: {
    flexDirection: "row",
    gap: spacing[2],
  },
  hudTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  hudTagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  insightsCard: {
    gap: spacing[4],
  },
  insightStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  insightStatLabel: {
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  insightStatValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  targetCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarWrapper: {
    gap: spacing[2],
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: fontSize.xs,
  },
  progressPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  textSection: {
    alignItems: "center",
    marginVertical: spacing[4],
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing[3],
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  slideTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  slideDesc: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: radius.xl,
    marginTop: spacing[2],
  },
  nextButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
