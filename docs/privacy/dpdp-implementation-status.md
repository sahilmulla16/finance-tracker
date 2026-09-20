# Pocketflow Finance — DPDP Implementation Status Matrix

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Active Engineering & Governance Tracking  
**Date**: September 2026  

---

## 1. Compliance & Implementation Matrix

| DPDP Requirement | Current Implementation | Evidence / File | Status | Gap | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Data Inventory & Minimisation (Sec 6)** | Itemized inventory of all collected identity, accounts, transactions, and preferences. Zero unneeded data collected. | `docs/privacy/data-inventory.md`, `artifacts/mobile/app/privacy-inventory.tsx` | **Implemented** | None in current local scope. | Re-audit if cloud sync is introduced. |
| **Notice & Transparency (Sec 5)** | Plain-English privacy notice explaining purposes, categories, rights, deletion, and contact info. | `artifacts/mobile/app/privacy.tsx`, `types/privacy.ts` | **Implemented** | Formal legal language verification. | Needs Legal Review prior to marketing. |
| **Consent Management (Sec 6)** | Purpose-specific consent manager separating mandatory local accounting from optional triggers/alerts. | `artifacts/mobile/app/privacy-consents.tsx`, `FinanceContext.tsx` | **Implemented** | None. Granular toggles update state and audit log. | Verify on real devices. |
| **Consent Withdrawal (Sec 6(4))** | Immediate functional withdrawal that turns off notifications or Quick Add without breaking core app. | `FinanceContext.updateConsent` | **Implemented** | None. Side effects immediately take effect. | Maintained in CI. |
| **Right to Access & Portability (Sec 11)** | "Access My Data" breakdown + "Download My Data" machine-readable JSON archive. Credentials strictly excluded. | `FinanceContext.downloadPersonalDataArchive`, `app/privacy-and-data.tsx` | **Implemented** | None. Standardized JSON package with metadata. | Periodic check of export payload. |
| **Right to Correction (Sec 12)** | Self-serve editing paths for profile, accounts, categories, plus formal request escalation. | `app/settings.tsx`, `app/accounts.tsx`, `app/privacy-requests.tsx` | **Implemented** | None. | Continue testing inline validation. |
| **Right to Erasure / Deletion (Sec 12)** | Two-step confirmation requiring typing "DELETE". Immediate purge of AsyncStorage and SQLite tables. | `FinanceContext.purgeAllUserData`, `StorageHelper.purgeAllStorage` | **Implemented** | None for local device. | If cloud backups introduced, ensure 30-day cloud sync purge. |
| **Right to Nominate (Sec 14)** | Technical nomination interface capturing nominee name, relationship, email, phone, and instructions. | `artifacts/mobile/app/privacy-nominee.tsx`, `FinanceContext.saveNominee` | **Implemented** | Legal rules for offline identity verification of nominees. | Needs Legal Review for estate handling. |
| **Grievance Redressal (Sec 13)** | In-app request submission and live status tracking for data inquiries and complaints. | `artifacts/mobile/app/privacy-requests.tsx`, `docs/privacy/privacy-request-process.md` | **Implemented** | Email ticketing integration for cloud tier. | Connect email forwarder to privacy@pocketflow.app. |
| **Privacy Audit Trail (Sec 8)** | Timestamped non-financial audit logging for privacy actions. Transaction amounts omitted. | `FinanceContext.logPrivacyEvent`, `types/privacy.ts` | **Implemented** | None. | Keep rolling buffer clean. |
| **Reasonable Security Safeguards (Sec 8(5))** | OS sandbox isolation, no embedded API secrets, no plain-text database credentials in APK. | `StorageHelper.kt`, `AndroidManifest.xml`, `app.config.js` | **Implemented** | None detected in audit. | Routine dependency vulnerability scanning. |
| **Data Breach Response Protocol (Sec 8(6))** | Internal operational SOP for containment, DPBI notification, and user alerts. | `docs/privacy/data-breach-response.md` | **Implemented** | Regulatory portal link for DPBI filing once notified by MeitY. | Needs Legal Review upon DPBI portal launch. |
| **Cross-Border Transfer Restrictions (Sec 16)** | All personal data remains strictly inside the user's physical device in India. | `docs/privacy/cross-border-data.md` | **Implemented** | None. Zero cross-border transmission. | Maintain Indian hosting for any future cloud tier. |
| **Children's Data Protection (Sec 9)** | Pocketflow is general-audience personal finance; no age verification wall currently exists. | `docs/privacy/data-inventory.md` | **Needs Business Decision** | Evaluating whether parental consent flow is required if teens under 18 use the app. | Business & legal decision on age restriction policy. |
| **Significant Data Fiduciary (Sec 10)** | Formal SDF assessment completed; classified as Standard Data Fiduciary. No DPO appointed. | `docs/privacy/sdf-assessment.md` | **Implemented** | N/A (Standard Data Fiduciary status). | Re-evaluate when active users exceed 1M. |
| **Cloud Database RLS & Schema (Sec 8)** | PostgreSQL Drizzle tables with Row-Level Security policies ensuring `auth.uid() = user_id`. | `lib/db/src/schema/privacy.ts`, `lib/db/migrations/0001_privacy_dpdp_tables.sql` | **Implemented** | Cloud sync currently dormant in mobile app. | Ready for migration when cloud sync is turned on. |

---

## 2. Key Action Items & Recommendations

1. **Email Provisioning**: Ensure `privacy@pocketflow.app` MX records and forwarding are live so emails from the Privacy Center reach the engineering and governance team.
2. **Pre-Production Legal Review**: Before publishing public claims regarding compliance, engage an Indian data protection attorney to review `app/privacy.tsx` and the Terms of Service.
3. **Age Restriction / Children's Policy**: Formulate clear business guidance on whether minors (under 18) are permitted to create accounts or whether Pocketflow should declare itself for general adult users.

