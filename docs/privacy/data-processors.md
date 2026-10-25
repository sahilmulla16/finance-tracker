# Zeno — Data Processor Inventory & Audit

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Verified Codebase Audit  
**Date**: September 2026  

---

## 1. Statutory Context (DPDP Section 8)

Under the Digital Personal Data Protection Act, 2023, a Data Fiduciary may engage a Data Processor to process personal data only under a valid contract. The Data Fiduciary remains accountable for ensuring the processor employs reasonable security safeguards and processes data solely for permitted purposes.

---

## 2. Actual Providers Audit (Codebase Verified)

| Provider / SDK | Role in Zeno | Personal Data Handled | Processing Location | Contract / Terms Status | Security Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Android OS / Google Play Services** | Underlying mobile operating system & local notification framework | None transmitted off-device; renders local system banners | Local User Device | Android Developer Agreement | OS-level application sandbox and app-private directory permissions |
| **AsyncStorage / SQLite** | Local embedded storage engine (`@react-native-async-storage/async-storage`) | Financial records, accounts, profile name, preferences | Local User Device (`/data/data/com.sahilmulla.pocketflow/databases/`) | Open Source (Apache 2.0 / MIT) | Android Linux file permission flags (`MODE_PRIVATE`), unreadable by other applications |
| **Expo Client & Modules** | Open-source runtime modules (fonts, haptics, linear gradient, symbols) | None. Purely client-side UI and hardware bridge utilities | Local User Device | Open Source (MIT) | Precompiled static binaries; no tracking telemetry bundled into preview/production APK |

---

## 3. Absence of Third-Party Trackers & External Cloud Processors

Our code-level audit of `artifacts/mobile/package.json` confirms that the following common third-party data processors are **completely absent**:

1. **No Analytics Providers**:
   - Google Analytics for Firebase: **NOT INSTALLED**
   - Segment: **NOT INSTALLED**
   - PostHog / Mixpanel / Amplitude: **NOT INSTALLED**
2. **No Crash Reporting Processors**:
   - Sentry: **NOT INSTALLED**
   - Firebase Crashlytics: **NOT INSTALLED**
   - Bugsnag: **NOT INSTALLED**
3. **No External AI APIs**:
   - OpenAI / Anthropic / Google Gemini APIs: **NOT INSTALLED / NO API KEYS**
   - No financial data is sent to external LLMs for analysis.
4. **No Cloud Database / Auth Processors in Mobile Bundle**:
   - Supabase SDK (`@supabase/supabase-js`): **NOT INSTALLED** in mobile package.json.
   - Firebase Authentication: **NOT INSTALLED**.
   - Auth0 / AWS Cognito: **NOT INSTALLED**.

---

## 4. Prepared Cloud-Ready Processor Standards (For Future Cloud Releases)

If and when Zeno implements cloud account backup, the following mandatory controls will be enforced before activating any cloud provider:
1. **Data Processing Agreement (DPA)** with statutory clauses mandated by the DPDP Rules 2025.
2. **Data Residency Compliance**: Cloud database nodes must be provisioned in Indian data centers (e.g. AWS `ap-south-1` Mumbai/Hyderabad, GCP `asia-south1`, or Azure Central India).
3. **Encryption Standards**: Encryption at rest (AES-256) and in transit (TLS 1.3).
4. **Zero Knowledge / E2EE Architecture**: Financial amounts encrypted using keys derived from user credentials before network transmission.

