/**
 * Pure Mathematical Motion Engine for Zeno Mascot.
 * All functions are Reanimated UI-thread worklets with zero runtime dependencies.
 * Fully compatible with Node.js test runners and React Native runtime.
 */

/**
 * High-precision cubic bezier evaluator using Newton-Raphson approximation.
 * Worklet compatible: can execute on both UI thread and JS engine.
 */
export function bezierFn(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  return function (x: number): number {
    "worklet";
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX =
        3 * (1 - t) * (1 - t) * t * x1 +
        3 * (1 - t) * t * t * x2 +
        t * t * t;
      const currentSlope =
        3 * (1 - t) * (1 - t) * x1 +
        6 * (1 - t) * t * (x2 - x1) +
        3 * t * t * (1 - x2);
      if (Math.abs(currentSlope) < 1e-5) break;
      t -= (currentX - x) / currentSlope;
      t = Math.max(0, Math.min(1, t));
    }

    return (
      3 * (1 - t) * (1 - t) * t * y1 +
      3 * (1 - t) * t * t * y2 +
      t * t * t
    );
  };
}

/** Travel curves for smooth gaze glide, sway, and organic translation */
export const EASE_IN_OUT = bezierFn(0.77, 0, 0.175, 1);
/** Arrive/open curves for eyelid reopening, mouth expansion */
export const EASE_OUT = bezierFn(0.23, 1, 0.32, 1);
/** Exit curves for fast snap closing */
export const EASE_IN = bezierFn(0.55, 0, 1, 0.45);

/** A keyframe: [timeMs, value, easingArrival?] */
export type Key = readonly [number, number, ("out" | "in" | "inOut")?];
export type Keys = readonly Key[];

/**
 * Evaluates the value of a keyframe track at time `t` (ms).
 * Executes as a Reanimated UI-thread worklet.
 */
export function track(t: number, keys: Keys): number {
  "worklet";
  if (!keys || keys.length === 0) return 0;
  if (t <= keys[0][0]) return keys[0][1];

  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1[0]) {
      const k0 = keys[i - 1];
      const span = k1[0] - k0[0];
      const p = span > 0 ? (t - k0[0]) / span : 1;
      const curve = k1[2] ?? "inOut";
      const e =
        curve === "out"
          ? EASE_OUT(p)
          : curve === "in"
          ? EASE_IN(p)
          : EASE_IN_OUT(p);
      return k0[1] + (k1[1] - k0[1]) * e;
    }
  }

  return keys[keys.length - 1][1];
}

/**
 * Smooth continuous sine wave in [-1, 1].
 */
export function wave(t: number, period: number, phase = 0): number {
  "worklet";
  return Math.sin((t / period + phase) * Math.PI * 2);
}

/**
 * Bell curve (0 at ends, 1 in center).
 */
export function bell(p: number): number {
  "worklet";
  return Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
}
