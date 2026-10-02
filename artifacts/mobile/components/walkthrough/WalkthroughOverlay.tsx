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
import { radius, spacing } from "@/constants/tokens";
import { triggerQuickAdd } from "@/utils/quickAddEvent";
import { haptics } from "@/utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function WalkthroughOverlay() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
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
        <View style={styles.centerModalBackdrop}>
          <View style={styles.centerCard}>
            <MascotGuide mascot="welcome" size={150} floating glow />

            <Text style={styles.centerTitle}>Let's get started</Text>
            <Text style={styles.centerSubtitle}>
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
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Walkthrough"
            >
              <Text style={styles.startBtnText}>Start Walkthrough</Text>
              <Feather name="arrow-right" size={18} color="#090B0A" />
            </Pressable>

            <Pressable
              onPress={() => {
                void haptics.selection();
                void skipWalkthrough();
              }}
              style={styles.centerSkipBtn}
              hitSlop={12}
            >
              <Text style={styles.centerSkipText}>Skip for now</Text>
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
        <View style={styles.completionBackdrop}>
          <View style={styles.completionCard}>
            <MascotGuide mascot="completed" size={160} floating glow />
            <Text style={styles.completionTitle}>You're all set!</Text>
            <Text style={styles.completionSubtitle}>
              You've connected an account, logged your first expense, and
              explored budgets. Start using Zeno to take full control of your
              finances.
            </Text>
            <Pressable
              onPress={() => {
                void haptics.success();
                void completeWalkthrough();
              }}
              style={styles.completionBtn}
              accessibilityRole="button"
              accessibilityLabel="Start Using Zeno"
            >
              <Text style={styles.completionBtnText}>Start Using Zeno</Text>
              <Feather name="arrow-right" size={18} color="#090B0A" />
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
    // User explores budgets screen for 2.5 seconds, then the celebration pop-up automatically appears!
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

  // Position of center FAB on tabs
  // In _layout.tsx, tab bar height is 88 with position: "absolute" (bottom: 0).
  // The FAB container has top: -20, placing the 56x56 FAB button center at SCREEN_HEIGHT - 80.
  // To perfectly center the 68x68 spotlight halo over the button, top = (SCREEN_HEIGHT - 80) - 34 = SCREEN_HEIGHT - 114.
  const fabSpotlight = {
    x: SCREEN_WIDTH / 2 - 34,
    y: SCREEN_HEIGHT - 114,
    size: 68,
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Translucent Dark Scrim - 0.45 opacity so user can clearly see real app UI behind */}
      <Animated.View
        style={[
          styles.scrim,
          {
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
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {info.stepNumber} of 3</Text>
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
          <Text style={styles.skipBtnText}>Skip tour</Text>
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
        <View style={styles.instructionCard}>
          {/* Header row with distinct Step Mascot */}
          <View style={styles.cardHeaderRow}>
            <MascotGuide mascot={info.mascot} size={76} floating glow={false} />
            <View style={styles.headerTextCol}>
              <Text style={styles.cardTitle}>{info.title}</Text>
              <Text style={styles.cardBody}>{info.body}</Text>
            </View>
          </View>

          {/* Directional Action Callout */}
          <View style={styles.directionRow}>
            <Text style={styles.directionText}>{info.instruction}</Text>
          </View>

          {/* Action Buttons (Only shown when an action is needed) */}
          {(info.primaryActionLabel || info.secondaryActionLabel) && (
            <View style={styles.actionsRow}>
              {info.secondaryActionLabel && (
                <Pressable
                  onPress={info.onSecondaryAction}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={8}
                >
                  <Text style={styles.secondaryBtnText}>
                    {info.secondaryActionLabel}
                  </Text>
                </Pressable>
              )}

              {info.primaryActionLabel && (
                <Pressable
                  onPress={info.onPrimaryAction}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={info.primaryActionLabel}
                >
                  <Text style={styles.primaryBtnText}>
                    {info.primaryActionLabel}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#090B0A" />
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
    backgroundColor: "rgba(9, 11, 10, 0.45)", // 45% opacity so user can clearly see background UI
  },
  centerModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 11, 10, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[5],
  },
  centerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#141715",
    borderWidth: 1,
    borderColor: "#262C28",
    borderRadius: radius.hero,
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[3],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  centerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  centerSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#A5AAA3",
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
    backgroundColor: "#B7FF63",
    marginTop: spacing[2],
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#090B0A",
  },
  centerSkipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  centerSkipText: {
    color: "#6E746F",
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
    backgroundColor: "rgba(183, 255, 99, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(183, 255, 99, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stepBadgeText: {
    color: "#B7FF63",
    fontSize: 12,
    fontWeight: "700",
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skipBtnText: {
    color: "#A5AAA3",
    fontSize: 13,
    fontWeight: "600",
  },
  spotlightHalo: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#B7FF63",
    backgroundColor: "rgba(183, 255, 99, 0.22)",
    shadowColor: "#B7FF63",
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
    backgroundColor: "#141715",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#262C28",
    padding: spacing[4],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
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
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#A5AAA3",
  },
  directionRow: {
    backgroundColor: "#1C221E",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: "#B7FF63",
  },
  directionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B7FF63",
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
    color: "#A5AAA3",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B7FF63",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#090B0A",
  },
  completionBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 11, 10, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[5],
  },
  completionCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#141715",
    borderWidth: 1,
    borderColor: "#262C28",
    borderRadius: radius.hero,
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[3],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: spacing[2],
    letterSpacing: -0.4,
  },
  completionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A5AAA3",
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
    backgroundColor: "#B7FF63",
    marginTop: spacing[3],
  },
  completionBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#090B0A",
  },
});
