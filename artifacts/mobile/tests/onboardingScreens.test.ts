import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Zeno Mobile Onboarding — Strict Specification Verification", () => {
  const welcomePath = path.resolve(
    __dirname,
    "../app/welcome.tsx",
  );
  const notificationStepPath = path.resolve(
    __dirname,
    "../components/onboarding/NotificationOnboardingStep.tsx",
  );
  const quickAddStepPath = path.resolve(
    __dirname,
    "../components/onboarding/QuickAddOnboardingStep.tsx",
  );
  const smartAutoTrackStepPath = path.resolve(
    __dirname,
    "../components/onboarding/SmartAutoTrackOnboardingStep.tsx",
  );
  const mascotGuidePath = path.resolve(
    __dirname,
    "../components/MascotGuide.tsx",
  );

  test("1. Step sequence and indices: Notifications (3 of 7), Quick Add (4 of 7), Smart Auto Track (5 of 7)", () => {
    const welcomeContent = fs.readFileSync(welcomePath, "utf-8");

    // Total steps must be 7
    assert.match(
      welcomeContent,
      /totalSteps=\{7\}/,
      "Onboarding must have exactly 7 steps",
    );

    // Carousel track must exist for zero-glitch transitions
    assert.match(
      welcomeContent,
      /carouselTrack/,
      "Must use hardware-accelerated carouselTrack to eliminate glitching",
    );

    // Step 2 is Notifications (3 of 7)
    assert.match(
      welcomeContent,
      /STEP 2: NOTIFICATIONS[\s\S]*?<NotificationOnboardingStep/,
      "Step 2 (3 of 7) must render NotificationOnboardingStep",
    );

    // Step 3 is Quick Add (4 of 7)
    assert.match(
      welcomeContent,
      /STEP 3: QUICK ADD[\s\S]*?<QuickAddOnboardingStep/,
      "Step 3 (4 of 7) must render QuickAddOnboardingStep",
    );

    // Step 4 is Smart Auto Track (5 of 7)
    assert.match(
      welcomeContent,
      /STEP 4: SMART AUTO-TRACK[\s\S]*?<SmartAutoTrackOnboardingStep/,
      "Step 4 (5 of 7) must render SmartAutoTrackOnboardingStep",
    );
  });

  test("2. 'Skip >' header visibility: visible on screens 2 through 6, hidden on 1 and 7", () => {
    const welcomeContent = fs.readFileSync(welcomePath, "utf-8");

    // Condition must be currentStep > 0 && currentStep < 6
    assert.match(
      welcomeContent,
      /currentStep > 0 && currentStep < 6/,
      "'Skip >' must be shown strictly on screens 2 through 6",
    );

    // Check Skip text and chevron
    assert.match(welcomeContent, /Skip/);
    assert.match(welcomeContent, /chevron-right/);
  });

  test("3. Mascot variants from Zeno-Mascot folder are mapped in MascotGuide", () => {
    const mascotGuideContent = fs.readFileSync(mascotGuidePath, "utf-8");

    assert.ok(
      mascotGuideContent.includes("Joyful Teal Cloud Mascot.webp"),
      "Joyful mascot must be mapped to WebP asset",
    );
    assert.ok(
      mascotGuideContent.includes("Glossy Mint Cloud Mascot Peeking.webp"),
      "Peeking mascot must be mapped to WebP asset",
    );
    assert.ok(
      mascotGuideContent.includes("Glossy Winking Cloud Mascot.webp"),
      "Winking mascot must be mapped to WebP asset",
    );
  });

  test("4. Screen 3 of 7: NotificationOnboardingStep layout and light theme colors", () => {
    const stepContent = fs.readFileSync(notificationStepPath, "utf-8");

    // Title and Subtitle
    assert.ok(
      stepContent.includes("Stay on top of your money."),
      "Must have title 'Stay on top of your money.'",
    );
    assert.ok(
      stepContent.includes("Get budget alerts and daily spending summaries so nothing slips by."),
      "Must have subtitle about budget alerts and daily spending summaries",
    );

    // Mascot
    assert.ok(
      stepContent.includes('mascot="joyful"'),
      "Must use joyful mascot",
    );

    // Ringing bell with motion arcs
    assert.ok(
      stepContent.includes("ringingBellContainer") || stepContent.includes("ringingBellBadge"),
      "Must include ringing bell badge in primary color",
    );

    // Light theme primary color support
    assert.ok(
      stepContent.includes("colors.primary"),
      "Must use colors.primary for light theme primary color adaptation",
    );

    // Stacked glass cards
    assert.ok(
      stepContent.includes("Budget alert"),
      "Front card must have 'Budget alert'",
    );
    assert.ok(
      stepContent.includes("80%"),
      "Must show 80% budget progress",
    );
    assert.ok(
      stepContent.includes("Daily summary"),
      "Back card must have 'Daily summary'",
    );
    assert.ok(
      stepContent.includes("₹840"),
      "Daily summary card must show ₹840",
    );

    // CTAs
    assert.ok(
      stepContent.includes("Allow notifications"),
      "Primary CTA must be 'Allow notifications'",
    );
    assert.ok(
      stepContent.includes("Maybe later"),
      "Secondary CTA must be 'Maybe later'",
    );
  });

  test("5. Screen 4 of 7: QuickAddOnboardingStep mobile screen frame and properly aligned mascot", () => {
    const stepContent = fs.readFileSync(quickAddStepPath, "utf-8");

    // Title and Subtitle
    assert.ok(
      stepContent.includes("Add an expense in seconds."),
      "Must have title 'Add an expense in seconds.'",
    );
    assert.ok(
      stepContent.includes("Press Volume Down twice to open Quick Add and record an expense without navigating the app."),
      "Must have correct subtitle",
    );

    // Mobile screen frame layer
    assert.ok(
      stepContent.includes("phoneDeviceShell"),
      "Must include phoneDeviceShell for the mobile screen backdrop layer",
    );
    assert.ok(
      stepContent.includes("Press Volume Down"),
      "Must include 'Press Volume Down' tooltip",
    );

    // Mascot aligned with hands on card edge
    assert.ok(
      stepContent.includes('mascot="peeking"'),
      "Must use peeking mascot",
    );
    assert.ok(
      stepContent.includes("peekingMascotAnchor"),
      "Must have peekingMascotAnchor",
    );

    // Light theme color adaptability
    assert.ok(
      stepContent.includes("colors.primary"),
      "Must use colors.primary for light theme colors",
    );

    // Quick Add Card details
    assert.ok(
      stepContent.includes("₹250"),
      "Quick Add card must show ₹250",
    );
    assert.ok(
      stepContent.includes("Food"),
      "Must show Food category chip",
    );
    assert.ok(
      stepContent.includes("circleConfirmBtn"),
      "Must have circle check button",
    );

    // CTAs
    assert.ok(
      stepContent.includes("Set up Quick Add"),
      "Primary CTA must be 'Set up Quick Add'",
    );
    assert.ok(
      stepContent.includes("Maybe later"),
      "Secondary CTA must be 'Maybe later'",
    );
  });

  test("6. Screen 5 of 7: SmartAutoTrackOnboardingStep real logos and light theme colors", () => {
    const stepContent = fs.readFileSync(smartAutoTrackStepPath, "utf-8");

    // Title and Subtitle
    assert.ok(
      stepContent.includes("Your expenses, tracked smarter."),
      "Must have title 'Your expenses, tracked smarter.'",
    );
    assert.ok(
      stepContent.includes("Let Zeno keep track of your spending so you can focus on what matters."),
      "Must have correct subtitle",
    );

    // Real brand logos
    assert.ok(
      stepContent.includes("SwiggyPinIcon"),
      "Must render authentic Swiggy pin logo",
    );
    assert.ok(
      stepContent.includes("ZomatoEmblem"),
      "Must render authentic Zomato wordmark logo",
    );
    assert.ok(
      stepContent.includes("AmazonSmileIcon"),
      "Must render authentic Amazon smile logo",
    );

    // 3 stacked transaction rows
    assert.ok(
      stepContent.includes("Swiggy"),
      "Must show Swiggy",
    );
    assert.ok(
      stepContent.includes("-₹320"),
      "Must show -₹320 for Swiggy",
    );
    assert.ok(
      stepContent.includes("Zomato"),
      "Must show Zomato in transaction list",
    );
    assert.ok(
      stepContent.includes("-₹450"),
      "Must show -₹450 for Zomato",
    );
    assert.ok(
      stepContent.includes("Amazon"),
      "Must show Amazon in transaction list",
    );
    assert.ok(
      stepContent.includes("-₹1,299"),
      "Must show -₹1,299 for Amazon",
    );

    // Bottom badge
    assert.ok(
      stepContent.includes("Automatically tracked"),
      "Must have 'Automatically tracked' badge",
    );

    // Light theme primary color
    assert.ok(
      stepContent.includes("colors.primary"),
      "Must adapt to colors.primary in light theme",
    );

    // CTAs
    assert.ok(
      stepContent.includes("Set up Smart Track"),
      "Primary CTA must be 'Set up Smart Track'",
    );
    assert.ok(
      stepContent.includes("Not now"),
      "Secondary CTA must be 'Not now'",
    );
  });

  test("7. Existing screens 1, 2, 6, 7 and top progress dots are strictly preserved", () => {
    const welcomeContent = fs.readFileSync(welcomePath, "utf-8");

    // Screen 1: Welcome Hero
    assert.ok(
      welcomeContent.includes("Take control of your money."),
      "Screen 1 headline must be preserved",
    );
    assert.ok(
      welcomeContent.includes("Get Started"),
      "Screen 1 Get Started button must be preserved",
    );

    // Screen 2: What can we call you?
    assert.ok(
      welcomeContent.includes("What can we call you?"),
      "Screen 2 headline must be preserved",
    );

    // Screen 6: Your basic setup
    assert.ok(
      welcomeContent.includes("Your basic setup."),
      "Screen 6 headline must be preserved",
    );

    // Screen 7: You're all set!
    assert.ok(
      welcomeContent.includes("You're all set!"),
      "Screen 7 headline must be preserved",
    );
    assert.ok(
      welcomeContent.includes("Launch Zeno"),
      "Screen 7 Launch Zeno button must be preserved",
    );

    // OnboardingProgress
    assert.ok(
      welcomeContent.includes("<OnboardingProgress currentStep={currentStep} totalSteps={7} />"),
      "OnboardingProgress dot motion and component must remain intact",
    );
  });

  test("8. Specific user refinements: sequential skip, step 1 name input order, compact phone mockup, smart track alignment, and lowered step 6 mascot", () => {
    const welcomeContent = fs.readFileSync(welcomePath, "utf-8");
    const quickAddContent = fs.readFileSync(quickAddStepPath, "utf-8");
    const smartTrackContent = fs.readFileSync(smartAutoTrackStepPath, "utf-8");

    // 1. Skip button advances to immediate next step (currentStep + 1)
    assert.match(
      welcomeContent,
      /animateToStep\(currentStep \+ 1\)/,
      "Top skip button must advance to currentStep + 1",
    );

    // 2. Step 1: name input is placed below the mascot and above 'What can we call you?'
    const step1Start = welcomeContent.indexOf("STEP 1: USER NAME");
    const mascotIdx = welcomeContent.indexOf('mascot="thinking"', step1Start);
    const inputIdx = welcomeContent.indexOf("styles.inputSection", step1Start);
    const titleIdx = welcomeContent.indexOf("What can we call you?", step1Start);
    assert.ok(
      mascotIdx !== -1 && inputIdx !== -1 && titleIdx !== -1,
      "Step 1 elements must all exist",
    );
    assert.ok(
      mascotIdx < inputIdx && inputIdx < titleIdx,
      "Name text field must be positioned below mascot and above 'What can we call you?'",
    );

    // 3. Step 3 (Quick Add): Realistic phone screen mockup, volume down highlight + acoustic waves, mascot at top right
    assert.ok(
      quickAddContent.includes("phoneScreenSurface") && quickAddContent.includes("statusBarRow"),
      "Quick Add must render a realistic phone screen surface with status bar",
    );
    assert.ok(
      quickAddContent.includes("rippleWavesAnchor") || quickAddContent.includes("volumeKeyDown"),
      "Quick Add must have radiating acoustic waves highlighting volume down",
    );
    assert.ok(
      quickAddContent.includes("peekingMascotAnchor"),
      "Mascot must be positioned at top right of the mobile screen mockup",
    );

    // 4. Step 4 (Smart Track): Mascot perched directly on Swiggy notification and badge lowered above headline
    assert.match(
      smartTrackContent,
      /marginBottom:\s*-34/,
      "Mascot must sit and reside directly on the top of the Swiggy notification component",
    );
    assert.match(
      smartTrackContent,
      /marginTop:\s*14/,
      "Automatically tracked badge must be lowered cleanly above the headline text",
    );

    // 5. Step 6 (You're all set): Mascot lowered closer to headline text
    assert.ok(
      welcomeContent.includes("mascotAreaLowered"),
      "Step 6 must use mascotAreaLowered to position mascot lower above the headline text",
    );
  });

  test("9. Screen recording tutorial video compression and asset preservation", () => {
    const tutVidDir = path.resolve(__dirname, "../assets/tut-vid");
    const originalQuickAdd = path.join(tutVidDir, "Quick ADD.mp4");
    const originalSmartTrack = path.join(tutVidDir, "smart auto Track .mp4");
    const compressedQuickAdd = path.join(tutVidDir, "quick_add_tutorial.mp4");
    const compressedSmartTrack = path.join(tutVidDir, "smart_track_tutorial.mp4");

    // Both original videos are safely preserved
    assert.ok(fs.existsSync(originalQuickAdd), "Original Quick ADD.mp4 must be preserved");
    assert.ok(fs.existsSync(originalSmartTrack), "Original smart auto Track .mp4 must be preserved");

    // Both compressed videos exist
    assert.ok(fs.existsSync(compressedQuickAdd), "Compressed quick_add_tutorial.mp4 must exist");
    assert.ok(fs.existsSync(compressedSmartTrack), "Compressed smart_track_tutorial.mp4 must exist");

    // Verify significant size reduction (each under 1.5MB, from >4.3MB)
    const quickAddStat = fs.statSync(compressedQuickAdd);
    const smartTrackStat = fs.statSync(compressedSmartTrack);

    assert.ok(
      quickAddStat.size < 1.5 * 1024 * 1024,
      `Quick Add compressed video should be under 1.5MB, got ${quickAddStat.size} bytes`,
    );
    assert.ok(
      smartTrackStat.size < 1.5 * 1024 * 1024,
      `Smart Track compressed video should be under 1.5MB, got ${smartTrackStat.size} bytes`,
    );
  });

  test("10. TutorialVideoModal implements expo-video, PiP handoff, Settings navigation, and strict permission verification", () => {
    const tutorialModalPath = path.resolve(
      __dirname,
      "../components/onboarding/TutorialVideoModal.tsx",
    );
    const tutorialContent = fs.readFileSync(tutorialModalPath, "utf-8");

    // Uses official expo-video player and VideoView
    assert.match(
      tutorialContent,
      /useVideoPlayer[\s\S]*?VideoView/,
      "Must use expo-video useVideoPlayer and VideoView",
    );

    // Picture-in-Picture support
    assert.match(
      tutorialContent,
      /allowsPictureInPicture=\{true\}/,
      "VideoView must enable allowsPictureInPicture",
    );
    assert.match(
      tutorialContent,
      /startPictureInPicture|enterPictureInPicture/,
      "Must trigger Picture-in-Picture handoff when user proceeds to Settings",
    );

    // 'Got It' button
    assert.match(
      tutorialContent,
      /Got It/,
      "Must include clear 'Got It' button below video",
    );

    // Opens Android Settings
    assert.match(
      tutorialContent,
      /openAccessibilitySettings|ACCESSIBILITY_SETTINGS/,
      "Must open accessibility settings for Quick Add",
    );
    assert.match(
      tutorialContent,
      /openNotificationListenerSettings|ACTION_NOTIFICATION_LISTENER_SETTINGS/,
      "Must open notification listener settings for Smart Track",
    );

    // Verifies permission on return from Settings (AppState change)
    assert.match(
      tutorialContent,
      /AppState\.addEventListener\(\s*["']change["']/,
      "Must listen to AppState change to check permission when user returns from Settings",
    );
    assert.match(
      tutorialContent,
      /isAccessibilityServiceEnabled/,
      "Must check actual accessibility permission",
    );
    assert.match(
      tutorialContent,
      /isNotificationListenerEnabled/,
      "Must check actual notification listener permission",
    );

    // Permission error banner and retry path
    assert.match(
      tutorialContent,
      /permissionError/,
      "Must track permissionError and not automatically advance if not enabled in Settings",
    );
  });

  test("11. AndroidManifest and app.json configuration for Picture-in-Picture", () => {
    const manifestPath = path.resolve(
      __dirname,
      "../android/app/src/main/AndroidManifest.xml",
    );
    const appJsonPath = path.resolve(__dirname, "../app.json");

    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");

    // Android Manifest supports Picture in Picture
    assert.match(
      manifestContent,
      /android:supportsPictureInPicture="true"/,
      "MainActivity must have android:supportsPictureInPicture='true'",
    );
    assert.match(
      manifestContent,
      /smallestScreenSize/,
      "MainActivity configChanges must include smallestScreenSize for PiP transitions",
    );

    // app.json expo-video plugin configuration
    assert.match(
      appJsonContent,
      /"expo-video"/,
      "app.json plugins must include expo-video",
    );
    assert.match(
      appJsonContent,
      /"supportsPictureInPicture":\s*true/,
      "app.json expo-video plugin must configure supportsPictureInPicture: true",
    );
  });

  test("12. Onboarding flow integration in welcome.tsx", () => {
    const welcomeContent = fs.readFileSync(welcomePath, "utf-8");

    // Imports and states
    assert.match(
      welcomeContent,
      /TutorialVideoModal/,
      "welcome.tsx must import TutorialVideoModal",
    );
    assert.match(
      welcomeContent,
      /tutorialFeature/,
      "welcome.tsx must maintain tutorialFeature state",
    );

    // Tutorial modal rendered conditionally
    assert.match(
      welcomeContent,
      /<TutorialVideoModal[\s\S]*?visible=\{tutorialFeature !== null\}/,
      "Must render TutorialVideoModal with active feature",
    );

    // Step 3 (Quick Add) triggers tutorial
    assert.match(
      welcomeContent,
      /onOpenTutorial=\{.*?setTutorialFeature\("quick_add"\)/,
      "Step 3 QuickAddOnboardingStep must have onOpenTutorial hook",
    );

    // Step 4 (Smart Track) triggers tutorial
    assert.match(
      welcomeContent,
      /onOpenTutorial=\{.*?setTutorialFeature\("smart_track"\)/,
      "Step 4 SmartAutoTrackOnboardingStep must have onOpenTutorial hook",
    );

    // Advances step only when permission check succeeds
    assert.match(
      welcomeContent,
      /onSuccess=\{[\s\S]*?animateToStep\(4\)[\s\S]*?animateToStep\(5\)/,
      "Must only advance steps when tutorial onSuccess callback triggers",
    );
  });
});
