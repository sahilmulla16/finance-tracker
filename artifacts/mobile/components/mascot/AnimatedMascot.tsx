import React, { useEffect, useState, useCallback } from "react";
import {
  AccessibilityInfo,
  AppState,
  AppStateStatus,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing as ReanimatedEasing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useLoopClock, track, wave, Keys } from "./motion";

// Local mascot layer assets (1254x1254 near-lossless alpha WebP)
const MASCOT_BASE = require("@/assets/mascot/mascot_base.webp");
const MASCOT_PUPILS = require("@/assets/mascot/mascot_pupils.webp");
const MASCOT_EYELIDS = require("@/assets/mascot/mascot_eyelids.webp");
const MASCOT_ORIGINAL = require("@/assets/images/mascot2.webp");

export type MascotMood = "idle" | "happy" | "thinking" | "alert";
export type MascotLookDirection = "center" | "left" | "right" | "up" | "down";

export interface AnimatedMascotProps {
  /**
   * Component size (width & height in dp). Default is 180.
   */
  size?: number;
  /**
   * Whether idle floating/breathing is enabled. Default is true.
   */
  floating?: boolean;
  /**
   * Whether tap interaction (haptic + bounce) is enabled. Default is true.
   */
  interactive?: boolean;
  /**
   * Emotional state affecting movement rhythm and expression. Default is 'idle'.
   */
  mood?: MascotMood;
  /**
   * Manual eye look direction. If omitted, autonomous gaze tracking is active.
   */
  lookDirection?: MascotLookDirection;
  /**
   * Optional callback when user taps the mascot.
   */
  onPress?: () => void;
  /**
   * Optional explicit pause (e.g. when off-screen).
   */
  paused?: boolean;
  /**
   * Custom outer container style.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Test ID for unit and e2e testing.
   */
  testID?: string;
}

// 7200ms master clock loop (2 full 3600ms breaths + choreographed blinks + gaze glides)
const LOOP_PERIOD = 7200;

// Choreography tracks (in ms)
// Eyelids track: 0 = fully open, 1 = fully closed
const LID_TRACK: Keys = [
  [0, 0],
  // Blink 1 (Single blink at 2100ms)
  [2100, 0],
  [2190, 1, "in"],    // Fast close (90ms)
  [2220, 1],          // Tiny hold (30ms)
  [2400, 0, "out"],   // Slower open (180ms)
  // Blink 2 (Double blink! 5200ms - 5700ms)
  [5200, 0],
  [5290, 1, "in"],    // Fast close
  [5380, 0.15, "out"],// Partial open
  [5460, 1, "in"],    // Second snap close
  [5490, 1],          // Brief hold
  [5680, 0, "out"],   // Full reopen
  [LOOP_PERIOD, 0],
];

// Gaze X track (pupil horizontal offset in canvas px)
const GAZE_X_TRACK: Keys = [
  [0, 0],
  [2800, 0],
  [3300, -12, "inOut"], // Look left towards waving hand
  [4500, -12],          // Hold
  [5000, 13, "inOut"],  // Glide right towards coin
  [6200, 13],           // Hold
  [6700, 0, "inOut"],   // Return smoothly to center
  [LOOP_PERIOD, 0],
];

// Gaze Y track (pupil vertical offset in canvas px)
const GAZE_Y_TRACK: Keys = [
  [0, 0],
  [3300, 0],
  [5000, 3, "inOut"],   // Subtle down-glance toward coin
  [6200, 3],
  [6700, 0, "inOut"],
  [LOOP_PERIOD, 0],
];

export function AnimatedMascot({
  size = 180,
  floating = true,
  interactive = true,
  mood = "idle",
  lookDirection,
  onPress,
  paused = false,
  style,
  testID = "animated-mascot",
}: AnimatedMascotProps) {
  // Accessibility: Reduced Motion detection
  const [reduceMotion, setReduceMotion] = useState(false);
  // App lifecycle: Active vs Background
  const [isAppActive, setIsAppActive] = useState(true);

  useEffect(() => {
    // 1. Initial check for reduced motion
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => setReduceMotion(false));

    // 2. Listen to OS reduced motion setting changes
    const motionSub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled),
    );

    // 3. Listen to AppState (pause animation when in background)
    const appStateSub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        setIsAppActive(nextState === "active");
      },
    );

    return () => {
      motionSub?.remove();
      appStateSub?.remove();
    };
  }, []);

  // Animation is live only when app is active, not paused, and reduced motion is disabled
  const isLive = isAppActive && !paused && !reduceMotion;

  // Master clock: loops from 0 to 7200ms
  const clock = useLoopClock(LOOP_PERIOD, isLive);

  // Interactive tap bounce & reaction values
  const tapScale = useSharedValue(1);
  const tapBlink = useSharedValue(0);

  // Dynamic overrides for directed gaze
  const manualGazeX = useSharedValue(0);
  const manualGazeY = useSharedValue(0);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    if (lookDirection === "left") targetX = -14;
    else if (lookDirection === "right") targetX = 14;
    else if (lookDirection === "up") targetY = -10;
    else if (lookDirection === "down") targetY = 10;

    manualGazeX.value = withTiming(targetX, {
      duration: 300,
      easing: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1),
    });
    manualGazeY.value = withTiming(targetY, {
      duration: 300,
      easing: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [lookDirection, manualGazeX, manualGazeY]);

  // Handle tap reaction
  const handlePress = useCallback(() => {
    if (interactive) {
      // 1. Haptic feedback
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // Safe fallback if native haptics unsupported
      }

      // 2. Playful squash and bounce
      tapScale.value = withSequence(
        withTiming(0.93, { duration: 90, easing: ReanimatedEasing.out(ReanimatedEasing.quad) }),
        withSpring(1.05, { damping: 7, stiffness: 220 }),
        withSpring(1.0, { damping: 10, stiffness: 180 }),
      );

      // 3. Quick cheerful wink/blink
      tapBlink.value = withSequence(
        withTiming(1, { duration: 80, easing: ReanimatedEasing.in(ReanimatedEasing.quad) }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 160, easing: ReanimatedEasing.out(ReanimatedEasing.quad) }),
      );
    }

    onPress?.();
  }, [interactive, onPress, tapScale, tapBlink]);

  // Scale factor from 1254 canvas to component size
  const scaleRatio = size / 1254;

  // Root container animation (Breathing + Floating + Tap Squash)
  const rootAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!isLive) {
      return {
        transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
      };
    }

    const t = clock.value;
    // Period adjustments based on mood
    const breathPeriod = mood === "happy" ? 2800 : mood === "thinking" ? 4400 : 3600;
    const breathIntensity = mood === "alert" ? 1.4 : 1.0;

    // Subtle vertical breathing float (±2.8px at default size)
    const floatY = floating ? wave(t, breathPeriod, 0) * (2.8 * breathIntensity) : 0;
    // Gentle squash/stretch (1.2% volume-preserving deformation)
    const breathScaleY = 1.0 + wave(t, breathPeriod, 0) * (0.012 * breathIntensity);
    const breathScaleX = 1.0 - wave(t, breathPeriod, 0) * (0.008 * breathIntensity);

    return {
      transform: [
        { translateY: floatY },
        { scaleX: breathScaleX * tapScale.value },
        { scaleY: breathScaleY * tapScale.value },
      ],
    };
  }, [isLive, floating, mood]);

  // Pupil animation (Gaze Glide)
  const pupilAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!isLive) {
      return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    let gx = 0;
    let gy = 0;

    if (lookDirection) {
      // Manual gaze direction
      gx = manualGazeX.value;
      gy = manualGazeY.value;
    } else {
      // Autonomous gaze choreography
      const t = clock.value;
      gx = track(t, GAZE_X_TRACK);
      gy = track(t, GAZE_Y_TRACK);

      if (mood === "thinking") {
        gy -= 6; // Look slightly upward when contemplating
      }
    }

    // Convert canvas displacement to component dp
    const tx = gx * scaleRatio;
    const ty = gy * scaleRatio;

    return {
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  }, [isLive, lookDirection, mood, scaleRatio]);

  // Eyelid overlay animation (Blinking)
  const eyelidAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!isLive) {
      return { opacity: 0 };
    }

    const choreoBlink = track(clock.value, LID_TRACK);
    // Combine choreo blink with tap reaction wink
    const totalBlink = Math.min(1, Math.max(choreoBlink, tapBlink.value));

    // Smooth eyelid wipe: scales down from top and fades in
    const scaleY = interpolate(totalBlink, [0, 1], [0.2, 1]);

    return {
      opacity: totalBlink,
      transform: [{ scaleY }],
    };
  }, [isLive]);

  // Reduced motion static fallback: render original untouched asset
  if (reduceMotion) {
    return (
      <View
        testID={testID}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel="Zeno Finance Mascot (Static)"
        style={[{ width: size, height: size }, style]}
      >
        <ExpoImage
          source={MASCOT_ORIGINAL}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          priority="high"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Zeno Finance Interactive Mascot"
      disabled={!interactive}
      onPress={handlePress}
      style={[{ width: size, height: size }, style]}
    >
      <Animated.View style={[{ width: size, height: size }, rootAnimatedStyle]}>
        {/* Layer 1: Base Character with pristine 3D white eye spheres */}
        <ExpoImage
          source={MASCOT_BASE}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          priority="high"
          cachePolicy="memory-disk"
        />

        {/* Layer 2: Pupils & Glossy Catchlights with Gaze Glide */}
        <Animated.View style={[StyleSheet.absoluteFill, pupilAnimatedStyle]}>
          <ExpoImage
            source={MASCOT_PUPILS}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
          />
        </Animated.View>

        {/* Layer 3: Eyelids & 3D Lash Arches for Natural Blinking */}
        <Animated.View style={[StyleSheet.absoluteFill, eyelidAnimatedStyle]}>
          <ExpoImage
            source={MASCOT_EYELIDS}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
