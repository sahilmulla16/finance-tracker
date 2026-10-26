import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { track, wave, bell, Keys } from "../components/mascot/motionMath";

describe("Interactive Animated Mascot System", () => {
  const assetsDir = path.resolve(__dirname, "../assets/mascot");
  const componentPath = path.resolve(__dirname, "../components/mascot/AnimatedMascot.tsx");
  const motionPath = path.resolve(__dirname, "../components/mascot/motion.ts");
  const contactSheetComponentPath = path.resolve(__dirname, "../components/mascot/MascotContactSheet.tsx");
  const previewScreenPath = path.resolve(__dirname, "../app/mascot-preview.tsx");

  test("1. All derived mascot layer assets exist with high-efficiency WebP and PNG formats", () => {
    assert.ok(fs.existsSync(assetsDir), "artifacts/mobile/assets/mascot directory must exist");

    const requiredAssets = [
      "mascot_base.webp",
      "mascot_pupils.webp",
      "mascot_eyelids.webp",
      "mascot_base.png",
      "mascot_pupils.png",
      "mascot_eyelids.png",
      "mascot_contact_sheet.png",
    ];

    requiredAssets.forEach((file) => {
      const filePath = path.join(assetsDir, file);
      assert.ok(fs.existsSync(filePath), `Missing asset: ${file}`);
      const stats = fs.statSync(filePath);
      assert.ok(stats.size > 0, `Asset ${file} must not be empty`);
    });

    // Ensure WebP assets achieve significant compression efficiency
    const baseWebpSize = fs.statSync(path.join(assetsDir, "mascot_base.webp")).size;
    const basePngSize = fs.statSync(path.join(assetsDir, "mascot_base.png")).size;
    assert.ok(
      baseWebpSize < basePngSize,
      `WebP (${baseWebpSize} bytes) should be smaller than PNG (${basePngSize} bytes)`,
    );
  });

  test("2. Motion engine: worklet track interpolation satisfies timing and easing contracts", () => {
    const testTrack: Keys = [
      [0, 0],
      [1000, 10, "inOut"],
      [2000, 10],
      [3000, 0, "out"],
    ];

    // At t <= start: returns initial value
    assert.equal(track(-100, testTrack), 0);
    assert.equal(track(0, testTrack), 0);

    // Midpoint of first segment: positive interpolation
    const midVal = track(500, testTrack);
    assert.ok(midVal > 0 && midVal < 10, `Midpoint should be between 0 and 10: got ${midVal}`);

    // Plateau region: exact hold
    assert.equal(track(1500, testTrack), 10);

    // Return segment midpoint: smoothly decrescendos towards 0
    const returnVal = track(2500, testTrack);
    assert.ok(returnVal > 0 && returnVal < 10, `Return midpoint should be between 0 and 10: got ${returnVal}`);

    // At t >= end: returns terminal value
    assert.equal(track(3000, testTrack), 0);
    assert.equal(track(5000, testTrack), 0);
  });

  test("3. Motion engine: wave and bell math utilities produce bounded smooth outputs", () => {
    // Wave should oscillate within [-1, 1]
    for (let t = 0; t <= 3600; t += 300) {
      const val = wave(t, 3600);
      assert.ok(val >= -1.0001 && val <= 1.0001, `Wave output out of bounds at ${t}: ${val}`);
    }

    // Bell curve: 0 at p=0 and p=1, 1 at p=0.5
    assert.ok(Math.abs(bell(0)) < 1e-6, "Bell at 0 must be 0");
    assert.ok(Math.abs(bell(1)) < 1e-6, "Bell at 1 must be 0");
    assert.ok(Math.abs(bell(0.5) - 1.0) < 1e-6, "Bell at 0.5 must be 1");
  });

  test("4. AnimatedMascot component implements Reanimated worklets, props, and accessibility", () => {
    assert.ok(fs.existsSync(componentPath), "AnimatedMascot.tsx must exist");
    const content = fs.readFileSync(componentPath, "utf8");

    // Must import Reanimated hooks
    assert.ok(content.includes("useAnimatedStyle"), "Must use useAnimatedStyle for transforms");
    assert.ok(content.includes("useSharedValue"), "Must use useSharedValue for reactive values");
    assert.ok(content.includes("withSequence"), "Must use withSequence for tap reaction");
    assert.ok(content.includes("worklet"), "Styles must execute as UI-thread worklets");

    // Must handle AccessibilityInfo for reduced motion
    assert.ok(
      content.includes("isReduceMotionEnabled"),
      "Must check AccessibilityInfo.isReduceMotionEnabled",
    );
    assert.ok(
      content.includes("reduceMotionChanged"),
      "Must subscribe to reduceMotionChanged listener",
    );

    // Must handle AppState to pause loops in background
    assert.ok(content.includes("AppState.addEventListener"), "Must subscribe to AppState changes");

    // Must support interactive tap and haptic feedback
    assert.ok(content.includes("Haptics.impactAsync"), "Must trigger native haptic feedback on tap");

    // Must configure memory-disk caching for zero decode lag
    assert.ok(content.includes('cachePolicy="memory-disk"'), "Must use cachePolicy='memory-disk'");
  });

  test("5. Gaze glide boundaries strictly stay within anatomical eye bounds", () => {
    const content = fs.readFileSync(componentPath, "utf8");

    // Extract GAZE_X_TRACK and GAZE_Y_TRACK values
    const gazeMatches = content.match(/\[\d+,\s*(-?\d+)/g);
    assert.ok(gazeMatches && gazeMatches.length > 0, "Should define keyframe values");

    // Canvas eye is ~160px wide, pupil is 110px. Max safe offset is ±20px on canvas
    // Check that maximum gaze track displacements never exceed 18px
    const gazeXDef = content.slice(content.indexOf("GAZE_X_TRACK"), content.indexOf("GAZE_Y_TRACK"));
    const values = [...gazeXDef.matchAll(/,\s*(-?\d+)/g)].map((m) => parseInt(m[1], 10));

    values.forEach((v) => {
      assert.ok(
        Math.abs(v) <= 18,
        `Gaze displacement ${v}px exceeds maximum eye socket boundary of 18px`,
      );
    });
  });

  test("6. MascotGuide provides seamless backward compatibility and animated integration", () => {
    const mascotGuidePath = path.resolve(__dirname, "../components/MascotGuide.tsx");
    const content = fs.readFileSync(mascotGuidePath, "utf8");

    assert.ok(content.includes("AnimatedMascot"), "MascotGuide must import AnimatedMascot");
    assert.ok(content.includes("animated?: boolean"), "MascotGuideProps must support animated prop");
    assert.ok(content.includes("interactive?: boolean"), "MascotGuideProps must support interactive prop");
    assert.ok(content.includes("mood?: MascotMood"), "MascotGuideProps must support mood prop");
    assert.ok(content.includes("lookDirection?: MascotLookDirection"), "MascotGuideProps must support lookDirection prop");
  });

  test("7. Welcome screen and AI tab integrate interactive AnimatedMascot", () => {
    const welcomePath = path.resolve(__dirname, "../app/welcome.tsx");
    const welcomeContent = fs.readFileSync(welcomePath, "utf8");
    assert.ok(
      welcomeContent.includes('mascot="welcome" size={200} floating animated interactive'),
      "Welcome screen must render animated interactive hero mascot",
    );

    const aiPath = path.resolve(__dirname, "../app/(tabs)/ai.tsx");
    const aiContent = fs.readFileSync(aiPath, "utf8");
    assert.ok(aiContent.includes("AnimatedMascot"), "ai.tsx must import AnimatedMascot");
    assert.ok(
      aiContent.includes("<AnimatedMascot") &&
        aiContent.includes('mood={mascotState === "THINKING" ? "thinking" : mascotState === "SUCCESS" ? "happy" : "idle"}'),
      "ai.tsx must render AnimatedMascot with adaptive mood states",
    );
  });

  test("8. Dedicated preview route and contact sheet component exist", () => {
    assert.ok(fs.existsSync(contactSheetComponentPath), "MascotContactSheet.tsx must exist");
    assert.ok(fs.existsSync(previewScreenPath), "mascot-preview.tsx route must exist");

    const sheetContent = fs.readFileSync(contactSheetComponentPath, "utf8");
    assert.ok(sheetContent.includes("mascot_contact_sheet.png"), "Contact sheet must load preview asset");
    assert.ok(sheetContent.includes("AnimatedMascot"), "Contact sheet must mount live AnimatedMascot");
  });
});
