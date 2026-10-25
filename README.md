# Zeno — Premium Offline-First Personal Finance Tracker

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Zeno** is a privacy-focused, offline-first personal finance tracker engineered for Android and cross-platform mobile environments. Built with modern React Native, Expo, and native Android integrations, Zeno delivers seamless expense tracking, automated SMS transaction detection, direct inline card management, and intelligent on-device spending analytics without sacrificing privacy.

---

## 🌟 Key Features

### 1. ⚡ Universal Smart Auto Track Engine
- **SMS & Notification Detection:** Automatically identifies transaction alerts from major public, private, and regional banks across India (HDFC, SBI, ICICI, Axis, Kotak, etc.).
- **Multi-Channel Coverage:** Accurately classifies UPI payments, ATM cash withdrawals, POS swipes, net banking (NEFT/IMPS/RTGS), debit/credit card charges, and salary credits.
- **Strict Safety Filters:** Filters out promotional SMS, loan offers, OT
P requests, bill reminders, mandate setups, and failed transactions to keep your books immaculate.
- **Intelligent Deduplication:** Features a reference-ID tracker and a 90-second sliding cross-channel window to eliminate duplicate logs, plus 30-day automatic refund reconciliation.

### 2. 💳 Accounts & Wallets Direct Management
- **Physical-Style Interactive Cards:** Display your bank accounts, credit cards, and digital wallets as interactive cards with realistic gradients and network badges.
- **Direct Inline Card Editing:** Tap and edit card balances, nicknames, and card numbers directly on the card face.
- **Theme-Aware Styling:** Card color palettes dynamically adapt between Light and Dark mode to ensure high contrast and readability.
- **Flexible Card Masking:** Front-end card numbers format as `**** {last4}` with instant editing and automatic 4-digit extraction.

### 3. 🎯 Savings Goals & Milestone Tracking
- **Visual Goal Cards:** Custom cover photos adapt smoothly to rectangular cards on the main screen.
- **85% High-Contrast Overlay:** Semi-translucent overlay ensures amounts, milestone dates, and progress indicators remain legible across light and dark themes.
- **Account-Linked Deposits:** Allocate money to savings goals with funds deducted directly from selected bank accounts or cash wallets.

### 4. 🪟 Native Android Quick Add Overlay & Tile
- **Instant Expense Logging:** Add expenses from any screen or app using a native Android Accessibility Service and Quick Settings Tile.
- **Picture-in-Picture (PiP) Tutorials:** Video setup guides support native Android Picture-in-Picture so users can follow instructions while navigating system settings.

### 5. 🧠 Local Zeno AI Spending Insights
- **100% On-Device Aggregation:** Ask natural-language queries (e.g. *"Show my spending in health"*) and get structured transaction lists and summaries.
- **Zero Cloud Leakage:** All financial computation, category resolution, and rule execution happen strictly on your device.

### 6. 🔒 Privacy-First & DPDP Compliant
- **Offline-First:** All transactional records, balances, categories, and merchant rules are stored locally on-device.
- **No Analytics or Trackers:** No third-party ad networks, no data broker sharing, and full export capability (JSON/CSV) at any time.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React Native 0.81](https://reactnative.dev) & [Expo SDK 54](https://expo.dev) |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) |
| **State Management** | React Context (`FinanceContext`) with asynchronous persistent storage |
| **Native Integrations** | Android Kotlin (`AccessibilityService`, `QuickAddModule`, `UpiNotificationListener`) |
| **Animation & Gestures** | React Native Reanimated & React Native Gesture Handler |
| **Media & Haptics** | Expo Video, Expo Image Picker, Expo Haptics, Expo Linear Gradient |
| **Testing** | Node.js native test runner (`node:test`, `tsx`) with 230+ automated tests |

---

## 📁 Repository Structure

```text
├── artifacts/
│   └── mobile/
│       ├── android/               # Native Android project & Kotlin services
│       │   └── app/src/main/java/.../pocketflow/
│       │       └── quickadd/      # SMS listener, QuickAdd overlay, StorageHelper
│       ├── app/                   # Expo Router screens
│       │   ├── (tabs)/            # Main tab navigation (Home, Expenses, Budgets, Profile, AI)
│       │   ├── accounts.tsx       # Accounts & Wallets management
│       │   ├── savings.tsx        # Savings Goals with milestone tracking
│       │   └── smart-auto-track.tsx # Universal Smart Auto Track settings
│       ├── assets/                # Mascots, icons, tutorials, and imagery
│       ├── components/            # UI components, modals, and design system elements
│       │   └── ui/                # AccountCard, CategoryVisual, Buttons, Badges
│       ├── context/               # FinanceContext state provider & storage sync
│       ├── services/              # Business logic services
│       │   ├── autoTrack/         # Universal SMS parser, bank registry, and deduplicator
│       │   ├── ai/                # On-device query engine and data aggregator
│       │   └── notifications/     # Budget alerts and financial scheduler
│       ├── tests/                 # Automated test suite (230+ unit & integration tests)
│       └── utils/                 # Formatters, card helpers, and category resolvers
├── docs/                          # DPDP compliance & privacy architecture docs
├── package.json                   # Workspace root configuration
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` or `pnpm`
- **Android Development** (optional, for native builds):
  - [Android Studio](https://developer.android.com/studio) with Android SDK (API 34+)
  - JDK 17

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sahilmulla16/zeno-main.git
   cd zeno-main
   ```

2. Install dependencies:
   ```bash
   npm --prefix artifacts/mobile install
   ```

### Running the App

- **Start Metro Bundler:**
  ```bash
  npm --prefix artifacts/mobile start
  ```

- **Run on Android Device / Emulator:**
  ```bash
  npm --prefix artifacts/mobile run android
  ```

- **Run on iOS Simulator (macOS required):**
  ```bash
  npm --prefix artifacts/mobile run ios
  ```

---

## 🧪 Testing & Verification

Zeno is thoroughly covered by an automated test suite verifying everything from regex banking SMS parsers to UI card rendering and theme transitions.

- **Run All Unit & Integration Tests:**
  ```bash
  npx tsx --tsconfig artifacts/mobile/tsconfig.json --test artifacts/mobile/tests/*.test.ts
  ```

- **Typecheck Codebase:**
  ```bash
  npm --prefix artifacts/mobile run typecheck
  ```

---

## 🔒 Security & Privacy

Zeno is built with an unapologetic privacy-first philosophy:
- **Zero Server Telemetry:** Your financial records and personal SMS data never leave your device.
- **No Hardcoded Secrets:** Environment configuration files (`.env*`), private keys, and keystores are strictly excluded from the repository.
- **DPDP Compliant:** Meets India's Digital Personal Data Protection standards for data minimization, local processing, and full user data sovereignty.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
