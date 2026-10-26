/**
 * Motion Engine for Zeno Animated Mascot.
 * Based on rossark0/rossark-motion-skill principles.
 * Re-exports pure worklet mathematical evaluators and provides Reanimated hooks.
 */
import { useEffect } from "react";
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

export {
  bezierFn,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_IN,
  track,
  wave,
  bell,
  type Key,
  type Keys,
} from "./motionMath";

/**
 * Looping clock from 0 to `period` ms.
 * When `live` is false (reduced motion, app in background, paused), freezes at 0.
 */
export function useLoopClock(period: number, live: boolean): SharedValue<number> {
  const clock = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(clock);
    clock.value = 0;
    if (!live) return;

    clock.value = withRepeat(
      withTiming(period, { duration: period, easing: Easing.linear }),
      -1,
    );

    return () => cancelAnimation(clock);
  }, [live, period, clock]);

  return clock;
}
