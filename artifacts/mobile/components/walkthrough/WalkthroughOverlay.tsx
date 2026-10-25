import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useSegments } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalkthrough, WalkthroughStep } from "@/context/WalkthroughContext";
import { MascotGuide, MascotType } from "@/components/MascotGuide";
import { preloadMascots } from "@/utils/mascotPreloader";
import { radius, spacing } from "@/constants/tokens";
import { useColors } from "@/hooks/useColors";
import { triggerQuickAdd } from "@/utils/quickAddEvent";
import { haptics } from "@/utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function WalkthroughOverlay() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const colors = useColors();
  const isDark = colors.isDark;

  const {
    isActive,
    currentStep,
    goToStep,
    skipWalkthrough,
    completeWalkthrough,
    hasAddedAccount,
    hasAddedExpense,
  } = useWalkthrough();

  const [isExploringBudgets, setIsExploringBudgets] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      void preloadMascots(["welcome", "checklist", "okay", "thinking", "completed"]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Continuous subtle pulse on spotlight
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isActive, fadeAnim, pulseAnim]);

  if (!isActive || currentStep === null) return null;

  // While user is inside /accounts creating their account, hide the overlay completely!
  const isAccountsRoute = (segments as string[]).includes("accounts");
  if (currentStep === 1 && isAccountsRoute) {
    return null;
  }

  // While user is exploring the budgets screen for 2-3 seconds, hide the overlay so they can view budgets cleanly!
  if (isExploringBudgets) {
    return null;
  }

  // Step 0: Center Screen "Let's get started" Modal with Start button
  if (currentStep === 0) {
    return (
      <Modal visible transparent animationType="fade">
        <View
          style={[
            styles.centerModalBackdrop,
            {
              backgroundColor: isDark
                ? "rgba(9, 11, 10, 0.78)"
                : "rgba(0, 0, 0, 0.55)",
            },
          ]}
        >
          <View
            style={[
              styles.centerCard,
              {
                backgroundColor: isDark ? "#141715" : "#FFFFFF",
                borderColor: isDark ? "#262C28" : "#E2E8E0",
                boxShadow: isDark
                  ? "0px 14px 34px rgba(0, 0, 0, 0.6)"
                  : "0px 12px 30px rgba(0, 0, 0, 0.12)",
              },
            ]}
          >
            <MascotGuide mascot="welcome" size={150} floating glow />

            <Text style={[styles.centerTitle, { color: colors.fg }]}>
              Let's get started
            </Text>
            <Text style={[styles.centerSubtitle, { color: colors.fgMuted }]}>
              Take a 60-second interactive tour to set up your account, log your
              first expense, and see your budget in action.
            </Text>

            <Pressable
              onPress={() => {
                void haptics.selection();
                goToStep(1);
              }}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Walkthrough"
            >
              <Text style={[styles.startBtnText, { color: colors.onPrimary }]}>
                Start Walkthrough
              </Text>
              <Feather name="arrow-right" size={18} color={colors.onPrimary} />
            </Pressable>

            <Pressable
              onPress={() => {
                void haptics.selection();
                void skipWalkthrough();
              }}
              style={styles.centerSkipBtn}
              hitSlop={12}
            >
              <Text style={[styles.centerSkipText, { color: colors.fgMuted }]}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Final Step: Celebration Modal
  if (currentStep === "completed") {
    return (
      <Modal visible transparent animationType="fade">
        <View
          style={[
            styles.completionBackdrop,
            {
              backgroundColor: isDark
                ? "rgba(9, 11, 10, 0.78)"
                : "rgba(0, 0, 0, 0.55)",
            },
          ]}
        >
          <View
            style={[
              styles.completionCard,
              {
                backgroundColor: isDark ? "#141715" : "#FFFFFF",
                borderColor: isDark ? "#262C28" : "#E2E8E0",
                boxShadow: isDark
                  ? "0px 14px 34px rgba(0, 0, 0, 0.6)"
                  : "0px 12px 30px rgba(0, 0, 0, 0.12)",
              },
            ]}
          >
            <MascotGuide mascot="completed" size={160} floating glow />
            <Text style={[styles.completionTitle, { color: colors.fg }]}>
              You're all set!
            </Text>
            <Text
              style={[styles.completionSubtitle, { color: colors.fgMuted }]}
            >
              You've connected an account, logged your first expense, and
              explored budgets. Start using Zeno to take full control of your
              finances.
            </Text>
            <Pressable
              onPress={() => {
                void haptics.success();
                void completeWalkthrough();
              }}
              style={[
                styles.completionBtn,
                { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Using Zeno"
            >
              <Text
                style={[styles.completionBtnText, { color: colors.onPrimary }]}
              >
                Start Using Zeno
              </Text>
              <Feather name="arrow-right" size={18} color={colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Active steps configuration (Steps 1, 2, 3)
  interface StepInfo {
    mascot: MascotType;
    stepNumber: number;
    title: string;
    body: string;
    instruction: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    showSpotlightFab?: boolean;
  }

  const handleOpenBudgets = () => {
    void haptics.selection();
    router.replace("/(tabs)/budgets" as never);
    setIsExploringBudgets(true);
    setTimeout(() => {
      setIsExploringBudgets(false);
      goToStep("completed");
    }, 2500);
  };

  const getStepInfo = (step: number): StepInfo => {
    switch (step) {
      case 1:
        return {
          mascot: "checklist",
          stepNumber: 1,
          title: "Step 1: Set up your account",
          body: "Add your bank account or cash wallet to keep all balances organized in one place.",
          instruction: hasAddedAccount
            ? "✓ Bank account connected!"
            : "→ Open Accounts to create your account",
          primaryActionLabel: "Open Accounts",
          onPrimaryAction: () => {
            void haptics.selection();
            router.push("/accounts" as never);
          },
          secondaryActionLabel: "I have an account →",
          onSecondaryAction: () => {
            void haptics.selection();
            goToStep(2);
          },
        };
      case 2:
        return {
          mascot: "okay",
          stepNumber: 2,
          title: "Step 2: Log your first expense",
          body: "Tap the + button below to record what you spent. Pick an amount and category.",
          instruction: hasAddedExpense
            ? "✓ Expense recorded!"
            : "↓ Tap the + button",
          showSpotlightFab: true,
        };
      case 3:
      default:
        return {
          mascot: "thinking",
          stepNumber: 3,
          title: "Step 3: Budgets & Insights",
          body: "Your expense is now tracked in your budget ring and monthly limits. Let's see your budget!",
          instruction: "→ Check your Budgets",
          primaryActionLabel: "Open Budgets",
          onPrimaryAction: handleOpenBudgets,
        };
    }
  };

  if (currentStep !== 1 && currentStep !== 2 && currentStep !== 3) {
    return null;
  }

  const currentStepNum = currentStep as 1 | 2 | 3;
  const info = getStepInfo(currentStepNum);

  const fabSpotlight = {
    x: SCREEN_WIDTH / 2 - 34,
    y: SCREEN_HEIGHT - 114,
    size: 68,
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Translucent Scrim */}
      <Animated.View
        style={[
          styles.scrim,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.65)"
              : "rgba(0, 0, 0, 0.4)",
            opacity: fadeAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* Top Header with Step indicator and Skip button */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing[3],
          },
        ]}
      >
        <View
          style={[
            styles.stepBadge,
            {
              backgroundColor: `${colors.primary}20`,
              borderColor: `${colors.primary}40`,
            },
          ]}
        >
          <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
            Step {info.stepNumber} of 3
          </Text>
        </View>

        <Pressable
          onPress={() => {
            void haptics.selection();
            void skipWalkthrough();
          }}
          hitSlop={12}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip tutorial"
        >
          <Text style={[styles.skipBtnText, { color: colors.fgMuted }]}>
            Skip tour
          </Text>
        </Pressable>
      </View>

      {/* Pulsing Spotlight Halo over Center + Button on Step 2 */}
      {info.showSpotlightFab && (
        <Animated.View
          style={[
            styles.spotlightHalo,
            {
              top: fabSpotlight.y,
              left: fabSpotlight.x,
              width: fabSpotlight.size,
              height: fabSpotlight.size,
              borderRadius: fabSpotlight.size / 2,
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}25`,
              shadowColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            hitSlop={8}
            onPress={() => {
              void haptics.selection();
              triggerQuickAdd("EXPENSE");
            }}
            accessibilityRole="button"
            accessibilityLabel="Tap plus to add expense"
          />
        </Animated.View>
      )}

      {/* Instructional Bottom Card */}
      <View
        style={[
          styles.bottomCardWrapper,
          {
            paddingBottom: info.showSpotlightFab
              ? 124
              : insets.bottom + spacing[4],
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.instructionCard,
            {
              backgroundColor: isDark ? "#141715" : "#FFFFFF",
              borderColor: isDark ? "#262C28" : "#E2E8E0",
              boxShadow: isDark
                ? "0px 10px 28px rgba(0,0,0,0.5)"
                : "0px 8px 24px rgba(0,0,0,0.08)",
            },
          ]}
        >
          {/* Header row with distinct Step Mascot */}
          <View style={styles.cardHeaderRow}>
            <MascotGuide mascot={info.mascot} size={76} floating glow={false} />
            <View style={styles.headerTextCol}>
              <Text style={[styles.cardTitle, { color: colors.fg }]}>
                {info.title}
              </Text>
              <Text style={[styles.cardBody, { color: colors.fgMuted }]}>
                {info.body}
              </Text>
            </View>
          </View>

          {/* Directional Action Callout */}
          <View
            style={[
              styles.directionRow,
              {
                backgroundColor: isDark ? "#1C221E" : "#EDF5ED",
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.directionText, { color: colors.primary }]}>
              {info.instruction}
            </Text>
          </View>

          {/* Action Buttons */}
          {(info.primaryActionLabel || info.secondaryActionLabel) && (
            <View style={styles.actionsRow}>
              {info.secondaryActionLabel && (
                <Pressable
                  onPress={info.onSecondaryAction}
                  style={styles.secondaryBtn}
                  accessibilityRole="button"
                  accessibilityLabel={info.secondaryActionLabel}
                >
                  <Text
                    style={[styles.secondaryBtnText, { color: colors.fgMuted }]}
                  >
                    {info.secondaryActionLabel}
                  </Text>
                </Pressable>
              )}

              {info.primaryActionLabel && (
                <Pressable
                  onPress={info.onPrimaryAction}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={info.primaryActionLabel}
                >
                  <Text
                    style={[styles.primaryBtnText, { color: colors.onPrimary }]}
                  >
                    {info.primaryActionLabel}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={colors.onPrimary}
                  />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  centerModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[5],
  },
  centerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.hero,
    borderWidth: 1,
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[3],
    elevation: 12,
  },
  centerTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: spacing[2],
    letterSpacing: -0.4,
  },
  centerSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: spacing[2],
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    width: "100%",
    height: 52,
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  centerSkipBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  centerSkipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    zIndex: 100,
  },
  stepBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  spotlightHalo: {
    position: "absolute",
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 10,
    zIndex: 95,
  },
  bottomCardWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    zIndex: 90,
  },
  instructionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    elevation: 12,
    gap: spacing[3],
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  headerTextCol: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  directionRow: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  directionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing[3],
    marginTop: 2,
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  completionBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[5],
  },
  completionCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: radius.hero,
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[3],
    elevation: 12,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: spacing[2],
    letterSpacing: -0.4,
  },
  completionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: spacing[2],
  },
  completionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    width: "100%",
    height: 52,
    borderRadius: radius.full,
    marginTop: spacing[3],
  },
  completionBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
