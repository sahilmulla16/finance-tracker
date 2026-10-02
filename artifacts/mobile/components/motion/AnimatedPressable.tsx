import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { motion } from "@/constants/motion";

export interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedback?: "light" | "medium" | "selection" | "none";
  children?: React.ReactNode;
}

export function AnimatedPressable({
  style,
  scaleTo = motion.scalePressed,
  hapticFeedback = "light",
  onPress,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (hapticFeedback === "light") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (hapticFeedback === "medium") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (hapticFeedback === "selection") {
      void Haptics.selectionAsync();
    }

    Animated.timing(scaleAnim, {
      toValue: scaleTo,
      duration: motion.durationPress,
      easing: motion.easingOut,
      useNativeDriver: true,
    }).start();

    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: motion.durationFast,
      easing: motion.easingDecelerate,
      useNativeDriver: true,
    }).start();

    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
