# Google Play Accessibility Declaration & Policy Compliance

> **Application Name:** Pocketflow (formerly Zeno)  
> **Package Name:** `com.sahilmulla.pocketflow`  
> **Service Class:** `com.sahilmulla.pocketflow.quickadd.QuickAddAccessibilityService`  
> **Target SDK:** 36 (Android 16) / Android 15 (API 35)  
> **Declaration Type:** Non-Assistive Tool Accessibility Usage (Hardware Shortcut Capture)  

---

## 1. Executive Declaration Text (For Google Play Console)

Copy the following text directly into the Google Play Console Accessibility Declaration form under **App Content > Accessibility**:

```text
Pocketflow uses Android AccessibilityService solely to detect a user-configured double-press of the Volume Down hardware button and launch Pocketflow's Quick Add interface when the app is not in the foreground. The service does not read window content, inspect other applications, perform UI automation, or collect unrelated accessibility data.
```

---

## 2. Technical Justification & Requirement Alignment

### Why does this feature need to work outside the foreground app?
Pocketflow's core utility is "frictionless point-of-sale expense logging". When a user pays for transit, street groceries, or quick counter purchases, opening the phone, navigating the launcher, launching the app, and finding the transaction screen introduces delay that leads to untracked expenses. By capturing a double-press of the Volume Down key globally, users can record a transaction in under 3 seconds without navigating through their phone.

### Why are ordinary in-app touch controls insufficient?
In-app touch controls only function when the app is running in the foreground and the screen is unlocked with Pocketflow active. Standard Android APIs do not permit listening to hardware key events outside an active Activity window, except via `AccessibilityService` (`onKeyEvent` with `canRequestFilterKeyEvents="true"`).

### Is Pocketflow an Accessibility Tool?
**NO.** Pocketflow is a personal finance management application. It does **not** claim to be an assistive device for individuals with disabilities (`android:isAccessibilityTool="false"` or omitted). It adheres strictly to the Play Store policy for non-accessibility apps utilizing accessibility APIs for specific hardware input handling.

---

## 3. Data Access & Boundary Specification

| Category | Policy Compliance Status | Details |
|---|:---:|---|
| **API Used** | `AccessibilityService.onKeyEvent` | Hardware key-filtering exclusively. |
| **Filtered Key** | `KeyEvent.KEYCODE_VOLUME_DOWN` | Only listens for double-press within 400ms. All single-press and non-volume clicks pass through transparently via `super.onKeyEvent(event)`. |
| **Window Content Inspected** | **NONE** (`accessibilityEventTypes=""`) | `onAccessibilityEvent()` is an empty no-op. The XML configuration sets `accessibilityEventTypes=""` so Android does not deliver UI tree events. |
| **Screen Reading / Scraping** | **PROHIBITED / ABSENT** | Zero UI hierarchy inspection, zero text scraping, zero window change monitoring. |
| **Banking / Sensitive App Monitoring** | **PROHIBITED / ABSENT** | Does not monitor or detect other financial, social, SMS, or banking apps. |
| **Credentials / Keystroke Logging** | **PROHIBITED / ABSENT** | Only filters `KEYCODE_VOLUME_DOWN`. It does not intercept alphanumeric keys, password inputs, or touch coordinates. |
| **Third-Party App Automation** | **PROHIBITED / ABSENT** | Does not perform clicks, gestures, swipes, or UI manipulation in any third-party app. |
| **Data Transmission / Analytics** | **NONE** | No keypress telemetry, timestamps, or usage data are transmitted to external servers. Data operations remain 100% on-device. |

---

## 4. In-App Prominent Disclosure & Consent Flow

In accordance with Google Play's Prominent Disclosure Requirements:
1. **Timing:** Displayed immediately before the user is directed to the Android Accessibility settings screen.
2. **Context:** Presented within the application settings (`Quick Add Settings`) when toggling on the Volume Down trigger or tapping the configuration button.
1. **Natural User Flow Placement:**
   - Displayed directly on the **Home Screen** (`app/(tabs)/index.tsx`) as a dedicated setup banner whenever the service is not active, ensuring users encounter the prompt naturally in ordinary app usage without having to dig into deep settings menus.
   - Also available contextually in **Settings > Quick Add** (`app/quick-add-settings.tsx`) when toggling the Volume Down trigger.
2. **Timing:**
   - Displayed *immediately before* the user is directed to the Android Accessibility settings screen. The Android settings screen is never launched without explicit affirmative consent.
3. **Disclosure Copy:**
   - **Title:** `Enable Quick Add Shortcut`
   - **Body:**
     > "Pocketflow can detect a double-press of the Volume Down button even when Pocketflow is not open. This lets you quickly open Quick Add and record an expense.
     > "Pocketflow can detect a double-press of the Volume Down button even when Pocketflow is not open. This lets you quickly open Quick Add and record an expense without opening the app.
     > 
     > Pocketflow uses Android Accessibility Service only for this hardware shortcut. It does not read your screen, messages, passwords, or content from other apps, and it does not control other apps."
     > Scope & Boundaries:
     > Pocketflow uses Android Accessibility Service only for this hardware button shortcut. It does NOT read your screen, inspect messages, view passwords, monitor banking apps, or control any other application."
   - **Action Buttons:**
     - `[Agree & Enable]`: Affirmatively records consent in persistent storage (`@pocketflow/accessibility_consent_granted = true`) and launches system settings.
     - `[Not Now]`: Cancels the request, dismisses the modal, and keeps the feature disabled.
4. **Visibility:** The disclosure is rendered in high-contrast text on a modal overlay, not hidden inside a Privacy Policy or Terms of Service document.
     - `[Not Now]`: Cancels the request, dismisses the modal, keeps the service unrequested, and allows the user to re-trigger whenever desired.
4. **Visibility & Distinction:**
   - The disclosure is rendered in high-contrast text on an unbundled, dedicated modal overlay (`AccessibilityDisclosureModal.tsx`), not bundled within a Privacy Policy, Terms of Service, or general onboarding screen.

---

## 5. Verification & Testing Steps for Google Play Reviewers
## 5. Entry Point & Launch Security Architecture

To prevent unauthorized cross-app invocation, data spoofing, or OEM launcher permission failures, Pocketflow utilizes a hardened entry architecture:

```
[Launcher Static Shortcut]
       ↓ (ACTION_VIEW / shortcuts.xml)
[QuickAddShortcutTrampolineActivity] (android:exported="true", Theme.NoDisplay)
  • Validates intent action
  • Zero financial parameters parsed
  • Performs zero DB/storage writes
       ↓ (Explicit Internal Intent)
[QuickAddActivity] (android:exported="false")
  • Non-exported internal dialog HUD
  • Protected from external third-party app calls
```

- **QuickAddActivity:** Configured with `android:exported="false"`. Cannot be invoked by any third-party application on the device.
- **QuickAddShortcutTrampolineActivity:** Minimal, exported trampoline (`Theme.NoDisplay`). Serves exclusively as the target for launcher shortcuts in `shortcuts.xml`. Parses no financial parameters, performs zero storage operations, launches `QuickAddActivity` via an explicit internal intent, and calls `finish()` immediately. This completely avoids signature-permission incompatibility crashes across non-standard OEM launchers while keeping financial write operations strictly non-exported.
- **Quick Settings Tile:** `QuickAddTileService` is protected by the system-only permission `android.permission.BIND_QUICK_SETTINGS_TILE`.
- **Accessibility Service:** `QuickAddAccessibilityService` is protected by the system-only permission `android.permission.BIND_ACCESSIBILITY_SERVICE`.

---

## 6. Verification & Testing Steps for Google Play Reviewers

1. **Verify No Screen Content Access:**
   - Review `artifacts/mobile/android/app/src/main/res/xml/accessibility_service_config.xml`:
     ```xml
     <accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
         android:accessibilityEventTypes=""
         android:accessibilityFeedbackType="feedbackGeneric"
         android:accessibilityFlags="flagRequestFilterKeyEvents"
         android:canRequestFilterKeyEvents="true"
         android:description="@string/accessibility_service_description" />
     ```
   - Notice `android:accessibilityEventTypes=""` ensures the service receives no UI events.
   - Inspect `QuickAddAccessibilityService.kt`: `onAccessibilityEvent` is empty (`// Intentionally no-op`).

2. **Verify Hardware Key Operation:**
   - Install the application.
   - Navigate to **Settings > Quick Add**.
   - Tap **Open Android Accessibility Settings**.
   - Review the prominent disclosure dialog and tap **Agree & Enable**.
   - In Android Settings > Downloaded Apps > Pocketflow / Zeno, turn the service ON.
   - Lock phone or return to Home Screen.
   - Double-press the **Volume Down** key within 400ms.
   - The Quick Add floating sheet appears.
   - A single press of Volume Down merely adjusts the system volume normally and does NOT trigger Quick Add.

---

*Disclaimer: This document establishes engineering compliance with Google Play Developer Policy on Accessibility Services. Final approval remains subject to review by Google Play evaluation systems and human reviewers.*

