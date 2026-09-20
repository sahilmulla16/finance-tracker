import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * 1. Privacy Consents Table
 * Tracks purpose-specific consents under DPDP Act 2023.
 * RLS: Users can only read and update records matching their own authenticated auth.uid().
 */
export const privacyConsentsTable = pgTable(
  "privacy_consents",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    purpose: text("purpose").notNull(),
    status: text("status").notNull(), // 'granted' | 'withdrawn'
    policyVersion: text("policy_version").notNull(),
    source: text("source").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_purpose_idx").on(table.userId, table.purpose),
    index("consents_user_idx").on(table.userId),
  ],
);

export type PrivacyConsent = typeof privacyConsentsTable.$inferSelect;
export type InsertPrivacyConsent = typeof privacyConsentsTable.$inferInsert;

/**
 * 2. Privacy Requests Table (Grievance Redressal)
 * Tracks user requests for access, correction, erasure, and grievances under DPDP Section 13.
 * RLS: Users can only SELECT and INSERT their own records. Staff/Privacy Contact handles updates.
 */
export const privacyRequestsTable = pgTable(
  "privacy_requests",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    requestType: text("request_type").notNull(),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("submitted"), // 'submitted' | 'under_review' | 'needs_information' | 'resolved' | 'rejected'
    responseNotes: text("response_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("requests_user_idx").on(table.userId),
    index("requests_status_idx").on(table.status),
  ],
);

export type PrivacyRequest = typeof privacyRequestsTable.$inferSelect;
export type InsertPrivacyRequest = typeof privacyRequestsTable.$inferInsert;

/**
 * 3. Nominees Table
 * Tracks technical nominations under DPDP Section 14.
 * RLS: Users can only manage their own nomination record.
 */
export const nomineesTable = pgTable(
  "nominees",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    nomineeName: text("nominee_name").notNull(),
    relationship: text("relationship").notNull(),
    email: text("email"),
    phone: text("phone"),
    specialInstructions: text("special_instructions"),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("nominee_user_idx").on(table.userId)],
);

export type Nominee = typeof nomineesTable.$inferSelect;
export type InsertNominee = typeof nomineesTable.$inferInsert;

/**
 * 4. Privacy Audit Events Table
 * Non-financial audit trail of privacy actions (notice shown, consent granted/withdrawn, export, purge).
 * Strictly forbids storing financial amounts or transaction details.
 */
export const privacyAuditEventsTable = pgTable(
  "privacy_audit_events",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    action: text("action").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_user_idx").on(table.userId),
    index("audit_action_idx").on(table.action),
  ],
);

export type PrivacyAuditEvent = typeof privacyAuditEventsTable.$inferSelect;
export type InsertPrivacyAuditEvent = typeof privacyAuditEventsTable.$inferInsert;

/**
 * 5. Policy Versions Table
 * Version history of the Pocketflow Privacy Notice.
 */
export const policyVersionsTable = pgTable("policy_versions", {
  version: varchar("version", { length: 32 }).primaryKey(),
  effectiveDate: text("effective_date").notNull(),
  summary: text("summary").notNull(),
  contentHash: text("content_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PolicyVersion = typeof policyVersionsTable.$inferSelect;
export type InsertPolicyVersion = typeof policyVersionsTable.$inferInsert;

