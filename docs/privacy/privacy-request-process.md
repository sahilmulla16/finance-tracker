# Pocketflow Finance — Privacy Request & Grievance Redressal SOP

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023 (Section 13)  
**Status**: Internal Operational Protocol  
**Date**: September 2026  

---

## 1. Statutory Mandate (DPDP Section 13)

Under Section 13 of the Digital Personal Data Protection Act, 2023, a Data Principal has the right to readily available means of grievance redressal provided by the Data Fiduciary regarding any act or omission in respect of the performance of its obligations or rights under the Act.

---

## 2. Request Handling Workflow

```
[User Submits Request via Privacy Center]
                  ↓
[Assigned Unique Request ID & Stored Locally]
                  ↓
[Transmission to Privacy Contact via In-App / Email]
                  ↓
[Triage & Verification within 48 Hours]
                  ↓
[Investigation & Action Taken (Access/Correction/Erasure)]
                  ↓
[Resolution Communicated to User within Prescribed Timeline]
```

---

## 3. Supported Request Categories & Timelines

| Request Type | Description | Primary In-App Self-Serve Path | Standard SLA |
| :--- | :--- | :--- | :--- |
| **Access My Data** | Inquiry regarding personal data held, data categories, or export archive. | `Profile → Privacy & Data → Download My Data` (Instant self-service JSON export) | Instant (Self-serve) / 72 hours for manual requests |
| **Correct My Data** | Correction of inaccurate, misleading, or outdated personal financial information. | Direct editing in `app/settings.tsx`, `app/accounts.tsx`, `app/categories.tsx` | Instant (Self-serve) / 7 days for complex assistance |
| **Delete My Data** | Erasure of personal data and closure of local financial records. | `Profile → Privacy & Data → Delete My Data` (Instant verified purge) | Immediate on device |
| **Withdraw Consent** | Revocation of optional processing consents (Quick Add, notifications, diagnostics). | `Profile → Privacy & Data → Consent & Permissions` | Immediate upon toggle change |
| **Privacy Complaint / Grievance** | Complaint regarding privacy practices, security concerns, or feature behavior. | `Profile → Privacy & Data → Privacy Requests & Grievance` | Acknowledged within 48h; resolved within 30 days |
| **Nomination Inquiry** | Inquiries regarding Section 14 nominee declaration or proof of authority. | `Profile → Privacy & Data → Nominee` | 7 business days |

---

## 4. Verification Protocol for Offline & Local Architecture
1. Because Pocketflow is an on-device application, user self-serve controls execute directly on the phone without intermediary staff review.
2. For manual inquiries sent via email (`privacy@pocketflow.app`):
   - The user must provide the email or mobile number associated with their inquiry.
   - For deceased Data Principals, nominees must submit proof of identity and a valid death certificate or court-certified document of incapacity before any archive can be transmitted.

---

## 5. Escalation to the Data Protection Board of India (DPBI)
If a Data Principal is not satisfied with the grievance redressal response provided by the Pocketflow Privacy Contact, they have the statutory right under Section 13(3) to make a complaint to the Data Protection Board of India.

