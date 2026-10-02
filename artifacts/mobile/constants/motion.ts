import { Easing } from "react-native";

/**
 * Zeno Motion System Tokens
 * Derived from the "Shared Motion / Spatial Continuity" specification:
 * - Premium, minimal, soft, native, fluid
 * - Decelerate / ease-out curves (no linear interpolation)
 */
export const motion = {
  // Durations (ms)
  durationFast: 120,
  durationNormal: 210,
  durationSlow: 280,
  durationPress: 90,

  // Spatial Distances (dp)
  distanceSmall: 8,
  distanceMedium: 12,
  distanceLarge: 20,

  // Scale Factors
  scaleInactive: 0.93,
  scaleTransition: 0.98,
  scalePressed: 0.97,
  scaleHighlight: 1.015,

  // Stagger intervals (ms)
  staggerFast: 25,
  staggerNormal: 35,

  // Standard Easing Curves
  // Apple-like smooth decelerate curve:
  easingDecelerate: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  // Responsive ease-out:
  easingOut: Easing.out(Easing.cubic),
  // Subtle spring for gesture recovery:
  springConfig: {
    friction: 8,
    tension: 50,
  },
} as const;

