import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  formatExpenseNotificationAmount,
  formatExpenseNotificationBody,
  isUserOrAccountIdentifier,
  sanitizeNotificationText,
  DEFAULT_EXPENSE_NOTIF_TITLE,
  NOTIFICATION_BULLET,
} from "../utils/notificationFormatter";

describe("Profile Picture Persistence & Durable Storage Verification", () => {
  const serviceFile = path.resolve(__dirname, "../services/profileImageService.ts");
  const profileScreenFile = path.resolve(__dirname, "../app/(tabs)/profile.tsx");
  const homeScreenFile = path.resolve(__dirname, "../app/(tabs)/index.tsx");

  test("1. profileImageService uses durable FileSystem.documentDirectory instead of temporary cache", () => {
    assert.ok(fs.existsSync(serviceFile), "profileImageService.ts should exist");
    const content = fs.readFileSync(serviceFile, "utf-8");

    // Must import from legacy expo-file-system for stability and documentDirectory access
    assert.ok(
      content.includes('import * as FileSystem from "expo-file-system/legacy";'),
      "Must import FileSystem from expo-file-system/legacy"
    );

    // Must target documentDirectory
    assert.ok(
      content.includes("FileSystem.documentDirectory"),
      "Must use durable FileSystem.documentDirectory"
    );

    // Must define user_profile subdirectory
    assert.ok(
      content.includes('"user_profile"'),
      "Must save profile pictures to dedicated user_profile directory"
    );

    // Must export essential durable storage operations
    assert.ok(content.includes("export async function saveProfileImage"), "Must export saveProfileImage");
    assert.ok(content.includes("export async function getValidProfileImageUri"), "Must export getValidProfileImageUri");
    assert.ok(content.includes("export async function deleteProfileImage"), "Must export deleteProfileImage");
  });

  test("2. profile.tsx and index.tsx implement avatar onError fallbacks to prevent blank white UI", () => {
    assert.ok(fs.existsSync(profileScreenFile), "profile.tsx should exist");
    assert.ok(fs.existsSync(homeScreenFile), "index.tsx should exist");

    const profileContent = fs.readFileSync(profileScreenFile, "utf-8");
    const homeContent = fs.readFileSync(homeScreenFile, "utf-8");

    // Profile screen must have avatarError state and onError fallback
    assert.ok(
      profileContent.includes("avatarError") && profileContent.includes("setAvatarError(true)"),
      "profile.tsx must track avatar error state"
    );
    assert.ok(
      profileContent.includes("onError={() => setAvatarError(true)}"),
      "profile.tsx Image must handle onError"
    );

    // Home screen header badge must have profileImageError state and onError fallback
    assert.ok(
      homeContent.includes("profileImageError") && homeContent.includes("setProfileImageError(true)"),
      "index.tsx must track profileImageError state"
    );
    assert.ok(
      homeContent.includes("onError={() => setProfileImageError(true)}"),
      "index.tsx header Image must handle onError"
    );
  });
});

describe("Notification Text Formatting & Mojibake Eradication", () => {
  test("1. Amount formatting produces 2 decimal places and correct currency symbol", () => {
    assert.equal(formatExpenseNotificationAmount(1, "INR"), "₹1.00");
    assert.equal(formatExpenseNotificationAmount(1.5, "INR"), "₹1.50");
    assert.equal(formatExpenseNotificationAmount(150.256, "INR"), "₹150.26");
    assert.equal(formatExpenseNotificationAmount(0, "INR"), "₹0.00");
    assert.equal(formatExpenseNotificationAmount(1, "USD"), "$1.00");
    assert.equal(formatExpenseNotificationAmount(1, "EUR"), "€1.00");
    assert.equal(formatExpenseNotificationAmount(1, "GBP"), "£1.00");
    assert.equal(formatExpenseNotificationAmount(1, "AED"), "د.إ 1.00");
    // Negative amounts formatted as positive magnitude
    assert.equal(formatExpenseNotificationAmount(-45, "INR"), "₹45.00");
  });

  test("2. Mojibake characters are completely sanitized", () => {
    assert.equal(sanitizeNotificationText("â‚¹1 for Others â€¢ Sahilmulla9152"), "₹1 for Others • Sahilmulla9152");
    assert.equal(sanitizeNotificationText("â€¢"), "•");
    assert.equal(sanitizeNotificationText("â‚¹"), "₹");
    assert.equal(sanitizeNotificationText("Ã¢â‚¬Â¢"), "•");
  });

  test("3. User identifiers, usernames, and account names are correctly filtered out", () => {
    const profileName = "Sahil Mulla";
    const userEmail = "sahilmulla9152@gmail.com";
    const accountNames = ["HDFC Savings", "Cash Wallet"];

    // User's own username handle / payee identifier
    assert.ok(isUserOrAccountIdentifier("Sahilmulla9152", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("sahilmulla9152", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("sahilmulla", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("Sahil Mulla", profileName, userEmail, accountNames));

    // User's accounts
    assert.ok(isUserOrAccountIdentifier("HDFC Savings", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("Cash Wallet", profileName, userEmail, accountNames));

    // Generic placeholders
    assert.ok(isUserOrAccountIdentifier("Others", profileName, userEmail, accountNames, "Others"));
    assert.ok(isUserOrAccountIdentifier("cash", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("upi", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("payment", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("transfer", profileName, userEmail, accountNames));

    // Pure phone numbers / card numbers
    assert.ok(isUserOrAccountIdentifier("+919876543210", profileName, userEmail, accountNames));
    assert.ok(isUserOrAccountIdentifier("9876543210", profileName, userEmail, accountNames));

    // Real merchants must NOT be filtered out
    assert.ok(!isUserOrAccountIdentifier("Starbucks", profileName, userEmail, accountNames));
    assert.ok(!isUserOrAccountIdentifier("Amazon", profileName, userEmail, accountNames));
    assert.ok(!isUserOrAccountIdentifier("Swiggy", profileName, userEmail, accountNames));
    assert.ok(!isUserOrAccountIdentifier("Zomato", profileName, userEmail, accountNames));
    assert.ok(!isUserOrAccountIdentifier("Uber", profileName, userEmail, accountNames));
  });

  test("4. Notification title matches standard requirements", () => {
    assert.equal(DEFAULT_EXPENSE_NOTIF_TITLE, "Expense tracked successfully");
    assert.equal(NOTIFICATION_BULLET, " • ");
  });

  test("5. Notification body formatting matches exact required specification", () => {
    const profileName = "Sahil Mulla";
    const userEmail = "sahilmulla9152@gmail.com";
    const accountNames = ["Main Account"];

    // Case A: 1 rupee expense with payee leaking user's handle -> must filter to "₹1.00 • Others"
    const leakedUserBody = formatExpenseNotificationBody(
      1,
      "INR",
      "Others",
      "Sahilmulla9152",
      profileName,
      userEmail,
      accountNames
    );
    assert.equal(leakedUserBody, "₹1.00 • Others");

    // Case B: 1 rupee expense with no merchant -> "₹1.00 • Others"
    const simpleBody = formatExpenseNotificationBody(1, "INR", "Others");
    assert.equal(simpleBody, "₹1.00 • Others");

    // Case C: Legitimate merchant included
    const merchantBody = formatExpenseNotificationBody(
      1,
      "INR",
      "Others",
      "Starbucks",
      profileName,
      userEmail,
      accountNames
    );
    assert.equal(merchantBody, "₹1.00 • Others • Starbucks");

    // Case D: Different category and currency
    const foodBody = formatExpenseNotificationBody(
      25.5,
      "USD",
      "Dining Out",
      "Chipotle",
      profileName,
      userEmail,
      accountNames
    );
    assert.equal(foodBody, "$25.50 • Dining Out • Chipotle");
  });
});

describe("Native Android Kotlin Code Quality & Encoding Checks", () => {
  const quickAddActivityPath = path.resolve(
    __dirname,
    "../android/app/src/main/java/com/sahilmulla/pocketflow/quickadd/QuickAddActivity.kt"
  );
  const upiListenerPath = path.resolve(
    __dirname,
    "../android/app/src/main/java/com/sahilmulla/pocketflow/quickadd/UpiNotificationListenerService.kt"
  );
  const notificationFormatterPath = path.resolve(
    __dirname,
    "../android/app/src/main/java/com/sahilmulla/pocketflow/quickadd/NotificationTextFormatter.kt"
  );

  test("1. Android Kotlin files exist and contain no corrupted mojibake bytes", () => {
    assert.ok(fs.existsSync(quickAddActivityPath), "QuickAddActivity.kt should exist");
    assert.ok(fs.existsSync(upiListenerPath), "UpiNotificationListenerService.kt should exist");
    assert.ok(fs.existsSync(notificationFormatterPath), "NotificationTextFormatter.kt should exist");

    const quickAddContent = fs.readFileSync(quickAddActivityPath, "utf-8");
    const upiContent = fs.readFileSync(upiListenerPath, "utf-8");
    const formatterContent = fs.readFileSync(notificationFormatterPath, "utf-8");

    // Check for corrupt strings
    assert.ok(!quickAddContent.includes("â€¢"), "QuickAddActivity must not contain corrupted â€¢");
    assert.ok(!quickAddContent.includes("â‚¹"), "QuickAddActivity must not contain corrupted â‚¹");
    assert.ok(!upiContent.includes("â€¢"), "UpiNotificationListenerService must not contain corrupted â€¢");
    assert.ok(!upiContent.includes("â‚¹"), "UpiNotificationListenerService must not contain corrupted â‚¹");

    // Verify NotificationTextFormatter defines clean constants
    assert.ok(
      formatterContent.includes('const val BULLET = " \\u2022 "'),
      "NotificationTextFormatter must use clean unicode bullet \\u2022"
    );
    assert.ok(
      formatterContent.includes('const val DEFAULT_TITLE = "Expense tracked successfully"'),
      "NotificationTextFormatter must use 'Expense tracked successfully' default title"
    );

    // Verify QuickAddActivity uses NotificationTextFormatter
    assert.ok(
      quickAddContent.includes("NotificationTextFormatter.formatNotificationBody") ||
      quickAddContent.includes("NotificationTextFormatter.DEFAULT_TITLE"),
      "QuickAddActivity must use NotificationTextFormatter"
    );

    // Verify UpiNotificationListenerService uses NotificationTextFormatter
    assert.ok(
      upiContent.includes("NotificationTextFormatter.formatNotificationBody") &&
      upiContent.includes("NotificationTextFormatter.DEFAULT_TITLE"),
      "UpiNotificationListenerService must use NotificationTextFormatter"
    );
  });
});

