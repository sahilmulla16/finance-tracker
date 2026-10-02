export type ConsentStatus = "granted" | "withdrawn";

export type ConsentRecord = {
  purpose: string;
  title: string;
  description: string;
  category: "required" | "optional";
  status: ConsentStatus;
  grantedAt?: string;
  withdrawnAt?: string;
  policyVersion: string;
  source: string;
};

export type PrivacyRequestType =
  | "access"
  | "correct"
  | "delete"
  | "withdraw"
  | "question"
  | "complaint"
  | "other";

export type PrivacyRequestStatus =
  | "submitted"
  | "under_review"
  | "needs_information"
  | "resolved"
  | "rejected";

export type PrivacyRequest = {
  id: string;
  type: PrivacyRequestType;
  subject: string;
  description: string;
  status: PrivacyRequestStatus;
  createdAt: string;
  updatedAt: string;
  responseNotes?: string;
};

export type NomineeRelationship =
  | "Spouse"
  | "Parent"
  | "Child"
  | "Sibling"
  | "Legal Representative"
  | "Other";

export type NomineeRecord = {
  name: string;
  relationship: NomineeRelationship | string;
  email: string;
  phone: string;
  specialInstructions?: string;
  registeredAt: string;
  updatedAt: string;
};

export type PrivacyAction =
  | "notice_shown"
  | "consent_granted"
  | "consent_withdrawn"
  | "data_export_requested"
  | "data_export_completed"
  | "deletion_requested"
  | "deletion_completed"
  | "privacy_request_created"
  | "privacy_request_resolved"
  | "nominee_updated";

export type PrivacyAuditEvent = {
  id: string;
  action: PrivacyAction;
  timestamp: string;
  details?: Record<string, string | number | boolean>;
};

export type PolicyVersionInfo = {
  version: string;
  effectiveDate: string;
  summary: string;
};

export const CURRENT_POLICY_VERSION: PolicyVersionInfo = {
  version: "v1.0",
  effectiveDate: "September 2026",
  summary: "Initial DPDP-focused privacy notice and data protection controls.",
};

export const PRIVACY_CONTACT = {
  name: "Zeno Privacy Contact",
  email: "privacy@zeno.app",
  role: "Privacy & Grievance Contact",
  address: "India",
};

