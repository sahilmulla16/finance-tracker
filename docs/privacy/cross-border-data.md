# Pocketflow Finance — Cross-Border Data Transfer Assessment

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Verified Codebase Audit  
**Date**: September 2026  

---

## 1. Statutory Context (DPDP Section 16)

Under Section 16 of the Digital Personal Data Protection Act, 2023, the Central Government may notify countries or territories outside India to which a Data Fiduciary may not transfer personal data (negative list / blacklisting approach), subject to any higher standard of restriction prescribed by other Indian sector-specific laws (e.g. RBI data localization mandates for payment system operators).

---

## 2. Technical Findings on Pocketflow Cross-Border Data Flows

| Component / Layer | External Data Transmission | Destination Country / Territory | Regulatory Impact | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile App (Frontend)** | None | Stored locally on user device | N/A (Data stays on physical phone) | Compliant (No transfer) |
| **Android Quick Add Service** | None | Stored in local SQLite database on phone | N/A | Compliant (No transfer) |
| **Third-Party Analytics SDKs** | None | No third-party tracking SDK installed | N/A | Compliant (Zero third-party exfiltration) |
| **Crash Telemetry** | None | No Sentry / Crashlytics installed | N/A | Compliant |
| **AI / LLM Services** | None | No remote AI endpoints invoked | N/A | Compliant |
| **User Data Exports** | Local Intent | User's chosen destination via Android Share Sheet | User-controlled transfer | Compliant (Explicit user transmission) |

---

## 3. Cloud Synchronization Readiness (Future Roadmap)

If a future update introduces optional cloud backup or sync:
1. **Primary Database Hosting**: The cloud database cluster (PostgreSQL / Supabase / AWS RDS) must be hosted within the territory of India (e.g. AWS Mumbai `ap-south-1` or Hyderabad `ap-south-2`).
2. **Payment Sector Alignment**: While Pocketflow is a personal tracker and not an RBI-licensed payment system provider, storing all financial transaction records inside India follows the best practices established by RBI circular RBI/2017-18/153.
3. **Cross-Border Transfer Restrictions**: No personal data will be transferred to countries restricted by the Central Government under DPDP Section 16(1).

