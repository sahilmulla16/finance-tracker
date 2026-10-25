# Zeno — Data Retention & Deletion Policy

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Implemented  
**Date**: September 2026  

---

## 1. Statutory Mandate (DPDP Section 8(7))

Under Section 8(7) of the Digital Personal Data Protection Act, 2023, a Data Fiduciary must erase personal data upon:
1. The Data Principal withdrawing their consent; or
2. It being reasonable to assume that the specified purpose for which personal data was collected is no longer being served,

whichever is earlier, unless retention is necessary for compliance with any law.

---

## 2. Retention Schedule by Data Category

| Data Category | Purpose of Retention | Retention Period | Deletion Trigger | Mechanism of Erasure |
| :--- | :--- | :--- | :--- | :--- |
| **Financial Records (Txns, Accounts)** | Provide budgeting, cash flow tracking, and balance computation. | Kept locally on device as long as the user retains the app. | User deletes specific transaction/account, or triggers "Delete My Data". | SQLite `DELETE` query and AsyncStorage state update. Immediate on device. |
| **Categories & Savings Goals** | Organize transactions and track milestone progress. | Kept until modified or removed by user. | User deletes category/goal, or wipes app. | AsyncStorage write; removed from state and storage. |
| **User Profile & Display Name** | Render personalized user interface. | Kept until updated or erased by user. | User modifies profile name or triggers "Delete My Data". | AsyncStorage write. |
| **Consent Records** | Evidence compliance with DPDP consent requirements. | Retained during active app lifecycle. | Full user data erasure via "Delete My Data". | Purged along with all other app keys. |
| **Privacy Requests & Grievances** | Maintain audit trail of user rights requests under Section 13. | Retained on device for user review. | User data erasure or uninstallation. | AsyncStorage purge. |
| **Non-Financial Privacy Audit Events** | Provide verifiable timestamped proof of privacy actions. | Rolling buffer of the latest 100 non-financial events. | Purged on full data erasure; single `deletion_completed` record retained. | Overwritten as circular log or purged. |
| **User Backups (JSON / CSV)** | Discretionary backups created by user. | Controlled solely by user. | User manually deletes file from their file manager / drive. | Outside app sandbox; managed by user file manager. |

---

## 3. Deletion Architecture & Technical Flow

When a user initiates **Profile → Privacy & Data → Delete My Data**:

1. **Authentication / Confirmation Check**:
   - The user must review a clear explanation of permanent loss.
   - The user must explicitly type the string `"DELETE"` into the confirmation input.
2. **Immediate Purge Sequence**:
   - `AsyncStorage.multiRemove` executes across all keys:
     - `@pocketflow/expenses`
     - `@pocketflow/categories`
     - `@pocketflow/settings`
     - `@pocketflow/paymentMethods`
     - `@pocketflow/accounts`
     - `@pocketflow/transactions`
     - `@pocketflow/savingsGoals`
     - `@pocketflow/quickAddSettings`
     - `@pocketflow/notifications`
     - `@pocketflow/privacy_consents`
     - `@pocketflow/privacy_requests`
     - `@pocketflow/nominee`
     - `@pocketflow/privacy_audit_events`
   - `StorageHelper.purgeAllStorage(context)` issues `DELETE FROM Storage` on the Android SQLite database.
3. **State Invalidation**:
   - All React state arrays are reset to empty arrays.
   - Default settings and seed categories are reinstated as if the app was newly installed.
4. **Audit Completion Record**:
   - A single post-deletion audit event (`action: "deletion_completed"`, `details: { status: "purged_all_personal_data" }`) is logged to demonstrate that the erasure was executed.
5. **Backup Disclaimer**:
   - Because Zeno does not hold cloud database backups, there are no deferred 30-day or 90-day cold backup retention delays. Erasure on the user's phone is instantaneous.

