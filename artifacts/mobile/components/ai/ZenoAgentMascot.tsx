import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { MascotGuide, MascotType } from "@/components/MascotGuide";
import { AIMascotState } from "@/services/ai/aiTypes";
import { useColors } from "@/hooks/useColors";

interface ZenoAgentMascotProps {
  state: AIMascotState;
  mode?: "hero" | "compact" | "mini";
  speechBubble?: string;
  style?: StyleProp<ViewStyle>;
}

export function ZenoAgentMascot({
  state,
  mode = "hero",
  speechBubble,
  style,
}: ZenoAgentMascotProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Map AI state to MascotGuide asset type
  const mascotType: MascotType = (() => {
    switch (state) {
      case "THINKING":
        return "thinking";
      case "SUCCESS":
        return "okay";
      case "WARNING":
        return "sad";
      case "ERROR":
        return "no-money";
      case "LISTENING":
        return "thinking";
      case "IDLE":
      default:
        return mode === "hero" ? "welcome" : "idle";
    }
  })();

  const size = mode === "hero" ? 104 : mode === "compact" ? 38 : 24;

  // Pulse animation when thinking
  useEffect(() => {
    if (state === "THINKING") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  return (
    <View style={[styles.container, style]}>
      {state === "THINKING" && (
        <Animated.View
          style={[
            styles.thinkingGlow,
            {
              backgroundColor: colors.primary,
              width: size + 24,
              height: size + 24,
              borderRadius: (size + 24) / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <Animated.View
        style={{ transform: [{ scale: state === "THINKING" ? pulseAnim : 1 }] }}
      >
        <MascotGuide
          mascot={mascotType}
          size={size}
          floating={mode === "hero"}
          speechBubble={speechBubble}
          glow={mode === "hero"}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  thinkingGlow: {
    position: "absolute",
    opacity: 0.18,
  },
});
