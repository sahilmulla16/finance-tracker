import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { motion } from "@/constants/motion";

export interface SharedCardTransitionProps {
  /** Unique key identifying the active step (e.g. "step1", "step2") */
  stepKey: string | number;
  /** Direction of movement: 1 for forward (slides from right), -1 for backward (slides from left) */
  direction?: 1 | -1;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function SharedCardTransition({
  stepKey,
  direction = 1,
  style,
  children,
}: SharedCardTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(
    new Animated.Value(direction * motion.distanceMedium),
  ).current;
  const scaleAnim = useRef(new Animated.Value(motion.scaleTransition)).current;

  useEffect(() => {
    // Reset initial values before starting transition
    fadeAnim.setValue(0);
    slideAnim.setValue(direction * motion.distanceMedium);
    scaleAnim.setValue(motion.scaleTransition);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: motion.durationNormal,
        easing: motion.easingDecelerate,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: motion.durationNormal,
        easing: motion.easingDecelerate,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: motion.durationNormal,
        easing: motion.easingDecelerate,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepKey, direction, fadeAnim, slideAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
