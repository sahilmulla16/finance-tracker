# Pocketflow Finance — Data Breach & Incident Response Plan

**Document Reference**: DPDP Founder Guide (September 2026) / Digital Personal Data Protection Act, 2023  
**Status**: Internal Operational Protocol  
**Date**: September 2026  

---

## 1. Statutory Mandate (DPDP Section 8(6))

Under Section 8(6) of the Digital Personal Data Protection Act, 2023:
> *"In the event of a personal data breach, the Data Fiduciary shall give the Data Protection Board of India and each affected Data Principal, intimation of such breach in such form and manner as may be prescribed."*

---

## 2. Breach Incident Lifecycle

```
[Detection & Alert]
       ↓
[Containment & Isolation]
       ↓
[Impact Assessment & Data Identification]
       ↓
[Regulatory Notification to DPBI]
       ↓
[Affected Data Principal Notification]
       ↓
[Remediation & Forensic Hardening]
       ↓
[Post-Incident Review & Record Keeping]
```

---

## 3. Operational Protocols by Stage

### Phase 1: Detection & Alert
- **Triggers**: Security vulnerability disclosure, unusual application crash reports, reports of unauthorized reverse engineering, or user-reported data leakages.
- **Incident Lead**: Pocketflow Privacy Contact (`privacy@pocketflow.app`).
- **Initial Log**: Timestamp, reporter, affected software version, and initial scope.

### Phase 2: Containment & Isolation
- For an on-device local app, security issues typically involve client-side package tampering or OS-level permission bypasses.
- **Immediate Actions**:
  - Deprecate vulnerable app releases via Google Play Console / Expo EAS update channel.
  - Issue emergency hotfix patch disabling compromised features.
  - Revoke any affected developer signing keys or repository access tokens.

### Phase 3: Impact Assessment
- Evaluate:
  - Nature and volume of personal data potentially exposed.
  - Number of users affected.
  - Risk of financial harm, fraud, or reputational damage.
  - Determination of whether encrypted or plaintext data was involved.

### Phase 4: Regulatory Notification to the Data Protection Board of India (DPBI)
- As required by the DPDP Rules 2025, notify the DPBI in the prescribed format:
  1. Nature and timestamp of the incident.
  2. Categories and volume of personal data involved.
  3. Steps taken to contain and mitigate the breach.
  4. Likely consequences and risks to affected Data Principals.
  5. Contact details of the designated Privacy Contact.

### Phase 5: Notification to Affected Data Principals
- In plain, simple language:
  1. A concise explanation of the incident and what happened.
  2. Description of the personal data involved (e.g. transaction descriptions, account labels).
  3. Concrete safety steps the user should take (e.g. update app immediately, export backup, review transactions).
  4. Remedial actions implemented by Pocketflow.
  5. Direct contact details for questions or grievance submissions.

### Phase 6: Post-Incident Review & Hardening
- Complete forensic root-cause analysis within 14 days.
- Update threat models and automated CI/CD security audits.
- Preserve incident documentation in secure internal compliance records for a minimum of 5 years.

