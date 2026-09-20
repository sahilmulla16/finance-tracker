# Pocketflow Finance — Data Inventory & Classification

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Verified Codebase Audit  
**Date**: September 2026  
**Application Architecture**: Local-first, on-device mobile application (React Native / Expo SDK 54)  

---

## 1. Executive Summary

This Data Inventory documents every category of personal data collected, stored, and processed by Pocketflow Finance. It reflects the **actual implementation** in the mobile codebase (`artifacts/mobile/context/FinanceContext.tsx`, `artifacts/mobile/android/app/src/main/java/com/sahilmulla/pocketflow/quickadd/StorageHelper.kt`) rather than hypothetical cloud features.

---

## 2. Personal Data Inventory

| Data Category | Specific Data Attributes | Source | Storage Location | Processing Purpose | Classification | Mandatory / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Identity** | Profile Name (`settings.profileName`), Custom Avatar Photo (`settings.profileImage`) | User Input / Image Picker | On-device `@pocketflow/settings` | Display user greeting and personalized app header | Personal Data | Optional (Name defaults to "Sahil Mulla", image is optional) |
| **Financial Accounts** | Account Name, Account Type (`CASH`, `BANK`, `UPI`, `SAVINGS`, `OTHER`), Opening Balance, Currency (`INR`, etc.), Active Status | User Input / Defaults | On-device `@pocketflow/accounts` | Calculate total net worth and maintain balance tracking per account | Financial Personal Data | Mandatory for core accounting |
| **Transactions** | Amount, Transaction Type (`INCOME`, `EXPENSE`, `TRANSFER`), Description / Notes, Category ID, Account ID, Date & Time, Timestamp | User Input / Quick Add HUD | On-device `@pocketflow/transactions` & local SQLite | Generate expense records, budget charts, and financial analytics | Financial Personal Data | Mandatory for expense tracking |
| **Budget & Goals** | Goal Name, Target Amount, Current Amount, Target Date, Category Tag, Color Tag | User Input / Defaults | On-device `@pocketflow/savingsGoals` | Track progress towards user financial savings milestones | Financial Personal Data | Optional |
| **Categories & Tags** | Category Name, Icon Name, Color Hex Code, Type (`expense`, `income`, `both`) | Seed Defaults / User Input | On-device `@pocketflow/categories` | Categorize expenditures and income | Personal Preferences | Mandatory for expense organization |
| **Payment Methods** | Method Name (e.g. `UPI`, `Cash`, `Card`), Default Selection Flag | User Input / Defaults | On-device `@pocketflow/paymentMethods` | Label the medium used for expenditure entries | Personal Preferences | Optional |
| **App Preferences** | Currency (`INR`, `USD`, `EUR`, `GBP`, `AED`), Appearance (`dark`, `light`, `system`), Notification Toggles | User Settings | On-device `@pocketflow/settings` | Render user interface in preferred visual style and currency symbol | Technical Configuration | Optional |
| **Quick Add Settings** | Volume-down trigger flag, Shortcut trigger flag, Notification tile flag, Default Account ID | User Settings | On-device `@pocketflow/quickAddSettings` | Enable fast 2-second transaction capture via Android hardware buttons | Technical Configuration | Optional |
| **Consent Records** | Purpose key, Title, Status (`granted` / `withdrawn`), Grant timestamp, Withdrawal timestamp, Policy version, Source | Consent Manager | On-device `@pocketflow/privacy_consents` | Maintain verifiable audit proof of processing consent under DPDP | Governance Data | Mandatory under DPDP Section 6 |
| **Privacy Requests** | Request ID, Type (`access`, `correct`, `delete`, etc.), Subject, Description, Status, Timestamps | Privacy Center UI | On-device `@pocketflow/privacy_requests` | Log and track user rights requests and grievance redressal | Governance Data | Mandatory under DPDP Section 13 |
| **Nominee Details** | Nominee Full Name, Relationship, Contact Email, Contact Phone, Special Instructions | User Input | On-device `@pocketflow/nominee` | Record designated individual authorized to exercise rights under DPDP Section 14 | Personal Data | Optional |
| **Privacy Audit Trail** | Action name (`consent_granted`, `data_export_completed`, etc.), Non-financial metadata, Timestamp | Application Lifecycle | On-device `@pocketflow/privacy_audit_events` | Verifiable audit log for data fiduciary accountability | Operational Log | Mandatory under DPDP accountability principle |

---

## 3. Data Pocketflow NEVER Collects

To prevent over-collection and protect user privacy, the following categories are strictly excluded from the codebase:

1. **No Phone Contacts or Address Books**: The app never requests or accesses the device address book.
2. **No Location or GPS**: The app never tracks or requests user GPS/geocoordinates.
3. **No SMS Scraping**: The app does not inspect, read, or parse SMS messages. All transaction logging is manual or via user-initiated Quick Add.
4. **No Financial Credentials**: Pocketflow never asks for, handles, or stores net-banking passwords, debit/credit card CVVs, or UPI PINs.
5. **No Cross-App Advertising Trackers**: No Google AdMob, Facebook SDK, Adjust, or AppsFlyer SDKs are installed.
6. **No Biometric Data**: Biometric authentication, if used by the device lock screen, is handled exclusively by the Android/iOS hardware Keystore; biometric hashes never enter app memory.

---

## 4. Verification & Audit Trail
- **Primary Source Code**: `artifacts/mobile/context/FinanceContext.tsx`
- **Native Android Storage**: `artifacts/mobile/android/app/src/main/java/com/sahilmulla/pocketflow/quickadd/StorageHelper.kt`
- **Types Schema**: `artifacts/mobile/types/privacy.ts`

