import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mascot Loading & Asset Performance Optimization", () => {
  const mascotsDir = path.resolve(__dirname, "../assets/images/mascots");

  const expectedMascots = [
    { key: "welcome", webp: "Welcome.webp", png: "Welcome.png" },
    { key: "thinking", webp: "Thinking.webp", png: "Thinking.png" },
    { key: "okay", webp: "okay.webp", png: "okay.png" },
    { key: "checklist", webp: "Checklist.webp", png: "Checklist.png" },
    { key: "completed", webp: "work-completed.webp", png: "work-completed.png" },
    { key: "hii", webp: "Hii.webp", png: "Hii.png" },
    { key: "idle", webp: "Idle.webp", png: "Idle.png" },
    { key: "sad", webp: "Sad.webp", png: "Sad.png" },
    { key: "no-money", webp: "No-Money.webp", png: "No-Money.png" },
  ];

  test("1. All 9 mascots have high-performance WebP assets and original PNG backups", () => {
    expectedMascots.forEach(({ webp, png }) => {
      const webpPath = path.join(mascotsDir, webp);
      const pngPath = path.join(mascotsDir, png);

      assert.ok(fs.existsSync(webpPath), `Missing WebP asset file: ${webp}`);
      assert.ok(fs.existsSync(pngPath), `Missing PNG backup file: ${png}`);

      assert.ok(fs.statSync(webpPath).size > 0, `WebP file is empty: ${webp}`);
      assert.ok(fs.statSync(pngPath).size > 0, `PNG file is empty: ${png}`);
    });
  });

  test("2. WebP assets achieve > 75% payload reduction compared to uncompressed PNGs", () => {
    let totalPng = 0;
    let totalWebp = 0;

    expectedMascots.forEach(({ webp, png }) => {
      const pngPath = path.join(mascotsDir, png);
      const webpPath = path.join(mascotsDir, webp);

      const pngSize = fs.statSync(pngPath).size;
      const webpSize = fs.statSync(webpPath).size;

      totalPng += pngSize;
      totalWebp += webpSize;

      const reductionPercent = ((pngSize - webpSize) / pngSize) * 100;
      assert.ok(
        reductionPercent > 75,
        `${webp} (${(webpSize / 1024).toFixed(1)} KB) did not achieve 75% reduction vs ${png} (${(pngSize / 1024).toFixed(1)} KB): was ${reductionPercent.toFixed(1)}%`
      );
    });

    const overallReduction = ((totalPng - totalWebp) / totalPng) * 100;
    assert.ok(
      overallReduction > 80,
      `Overall reduction should exceed 80%: achieved ${overallReduction.toFixed(1)}%`
    );
  });

  test("3. MascotGuide component file configures expo-image with memory-disk caching and instant rendering", () => {
    const mascotGuidePath = path.resolve(__dirname, "../components/MascotGuide.tsx");
    assert.ok(fs.existsSync(mascotGuidePath), "MascotGuide.tsx must exist");
    const content = fs.readFileSync(mascotGuidePath, "utf8");

    // Must use expo-image for high-performance native decoding
    assert.ok(content.includes('from "expo-image"'), "Must import Image from expo-image");
    assert.ok(content.includes('cachePolicy="memory-disk"'), "Must use cachePolicy='memory-disk'");
    assert.ok(content.includes('contentFit="contain"'), "Must use contentFit='contain'");
    assert.ok(content.includes('priority='), "Must specify high priority decoding");

    // Must reference the WebP assets
    expectedMascots.forEach(({ webp }) => {
      assert.ok(content.includes(webp), `MascotGuide.tsx must map to ${webp}`);
    });

    // Must have removed the artificial 350ms delay fadeAnim
    assert.ok(!content.includes("fadeAnim"), "MascotGuide.tsx must not contain artificial fadeAnim delay");
  });

  test("4. Mascot preloader utility exists and pre-warms memory cache", () => {
    const preloaderPath = path.resolve(__dirname, "../utils/mascotPreloader.ts");
    assert.ok(fs.existsSync(preloaderPath), "mascotPreloader.ts must exist");
    const content = fs.readFileSync(preloaderPath, "utf8");

    assert.ok(content.includes("preloadMascots"), "Must export preloadMascots function");
    assert.ok(content.includes("Asset.fromModule"), "Must use Asset.fromModule");
    assert.ok(content.includes("prefetch"), "Must prefetch into memory-disk cache");
  });

  test("5. Zeno-Mascot folder has all 13 images converted to WebP with sizes under 200 KB", () => {
    const zenoMascotDir = path.resolve(__dirname, "../assets/images/Zeno-Mascot");
    assert.ok(fs.existsSync(zenoMascotDir), "Zeno-Mascot folder must exist");

    const files = fs.readdirSync(zenoMascotDir);
    const webpFiles = files.filter((f) => f.endsWith(".webp"));
    const pngFiles = files.filter((f) => f.endsWith(".png"));

    assert.equal(pngFiles.length, 13, "Should have 13 source PNG mascots");
    assert.equal(webpFiles.length, 13, "Should have 13 converted WebP mascots");

    webpFiles.forEach((file) => {
      const filePath = path.join(zenoMascotDir, file);
      const size = fs.statSync(filePath).size;
      assert.ok(
        size < 200 * 1024,
        `${file} should be under 200 KB: was ${(size / 1024).toFixed(1)} KB`
      );
    });
  });

  test("6. Zeno AI screen uses ExpoImage with Hello.webp and memory-disk caching", () => {
    const aiScreenPath = path.resolve(__dirname, "../app/(tabs)/ai.tsx");
    assert.ok(fs.existsSync(aiScreenPath), "ai.tsx must exist");
    const content = fs.readFileSync(aiScreenPath, "utf8");

    assert.ok(content.includes('from "expo-image"'), "ai.tsx must import ExpoImage");
    assert.ok(content.includes("Hello.webp"), "ai.tsx must use Hello.webp for hero mascot");
    assert.ok(content.includes('cachePolicy="memory-disk"'), "ai.tsx must configure cachePolicy='memory-disk'");
    assert.ok(content.includes("preloadMascots"), "ai.tsx must call preloadMascots on mount");
  });

  test("7. Onboarding and Walkthrough use MascotGuide with preloading", () => {
    const welcomePath = path.resolve(__dirname, "../app/welcome.tsx");
    const walkthroughPath = path.resolve(__dirname, "../components/walkthrough/WalkthroughOverlay.tsx");

    assert.ok(fs.existsSync(welcomePath), "welcome.tsx must exist");
    assert.ok(fs.existsSync(walkthroughPath), "WalkthroughOverlay.tsx must exist");

    const welcomeContent = fs.readFileSync(welcomePath, "utf8");
    const walkthroughContent = fs.readFileSync(walkthroughPath, "utf8");

    assert.ok(welcomeContent.includes("<MascotGuide"), "welcome.tsx must render MascotGuide");
    assert.ok(welcomeContent.includes("preloadMascots"), "welcome.tsx must preload mascots");

    assert.ok(walkthroughContent.includes("<MascotGuide"), "WalkthroughOverlay.tsx must render MascotGuide");
    assert.ok(walkthroughContent.includes("preloadMascots"), "WalkthroughOverlay.tsx must preload mascots");
  });
});

