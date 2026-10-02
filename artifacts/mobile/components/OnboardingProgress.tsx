import React from "react";
import { StyleSheet, View } from "react-native";
import { radius } from "@/constants/tokens";

interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number;
  activeColor?: string;
  inactiveColor?: string;
}

/**
 * Minimal progress indicator inspired by Reference 1.
 * Subtle, non-intrusive dots showing the user's progress.
 */
export function OnboardingProgress({
  totalSteps,
  currentStep,
  activeColor = "#B7FF63",
  inactiveColor = "#262C28",
}: OnboardingProgressProps) {
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
                backgroundColor: isActive ? activeColor : inactiveColor,
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
