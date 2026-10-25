import React from "react";
import { StyleSheet, View } from "react-native";
import { radius } from "@/constants/tokens";
import { useColors } from "@/hooks/useColors";

interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number;
  activeColor?: string;
  inactiveColor?: string;
}

/**
 * Minimal progress indicator inspired by modern financial apps.
 * Subtle, non-intrusive dots indicating onboarding journey progress.
 */
export function OnboardingProgress({
  totalSteps,
  currentStep,
  activeColor,
  inactiveColor,
}: OnboardingProgressProps) {
  const colors = useColors();

  const resolvedActiveColor = activeColor || colors.primary;
  const resolvedInactiveColor =
    inactiveColor || (colors.isDark ? "#262C28" : "#E2E8E0");

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isActive = idx === currentStep;
        return (
          <View
            key={idx}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
              {
                backgroundColor: isActive
                  ? resolvedActiveColor
                  : resolvedInactiveColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    height: 6,
    borderRadius: radius.full,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
});
