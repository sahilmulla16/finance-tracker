import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { radius, spacing } from "@/constants/tokens";

export type MascotType =
  | "welcome"
  | "thinking"
  | "okay"
  | "checklist"
  | "completed"
  | "hii"
  | "idle"
  | "sad"
  | "no-money";

const MASCOT_MAP: Record<MascotType, ImageSourcePropType> = {
  welcome: require("@/assets/images/mascots/Welcome.png"),
  thinking: require("@/assets/images/mascots/Thinking.png"),
  okay: require("@/assets/images/mascots/okay.png"),
  checklist: require("@/assets/images/mascots/Checklist.png"),
  completed: require("@/assets/images/mascots/work-completed.png"),
  hii: require("@/assets/images/mascots/Hii.png"),
  idle: require("@/assets/images/mascots/Idle.png"),
  sad: require("@/assets/images/mascots/Sad.png"),
  "no-money": require("@/assets/images/mascots/No-Money.png"),
};

interface MascotGuideProps {
  mascot: MascotType;
  size?: number;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  speechBubble?: string;
  glow?: boolean;
}

/**
 * Reusable Mascot Guide component for Zeno.
 * Renders the provided 3D wallet mascot assets without distortion or alteration.
 */
export function MascotGuide({
  mascot,
  size = 180,
  floating = true,
  style,
  imageStyle,
  speechBubble,
  glow = true,
}: MascotGuideProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle entrance fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    if (!floating) return;

    // Subtle gentle floating motion
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [floatAnim, fadeAnim, floating]);

  const source = MASCOT_MAP[mascot] || MASCOT_MAP.welcome;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: floatAnim }],
        },
        style,
      ]}
    >
      {/* Subtle ambient aura behind mascot */}
      {glow && (
        <View
          style={[
            styles.ambientAura,
            {
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Speech bubble if provided */}
      {speechBubble && (
        <View style={styles.speechBubble}>
          <Text style={styles.speechBubbleText}>{speechBubble}</Text>
          <View style={styles.speechArrow} />
        </View>
      )}

      {/* Mascot Image with aspect ratio preserved */}
      <Image
        source={source}
        style={[
          {
            width: size,
            height: size,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientAura: {
    position: "absolute",
    backgroundColor: "rgba(183, 255, 99, 0.08)",
  },
  speechBubble: {
    position: "absolute",
    top: -36,
    backgroundColor: "#18201A",
    borderWidth: 1,
    borderColor: "rgba(183, 255, 99, 0.3)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.lg,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  speechBubbleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  speechArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 6,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(183, 255, 99, 0.3)",
  },
});
