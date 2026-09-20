-- ============================================================================
-- POCKETFLOW FINANCE - DPDP PRIVACY & DATA PROTECTION TABLES & RLS MIGRATION
-- Migration: 0001_privacy_dpdp_tables.sql
-- Reference: Digital Personal Data Protection Act, 2023 & DPDP Founder Guide
-- ============================================================================

-- 1. Create Privacy Consents Table
CREATE TABLE IF NOT EXISTS "privacy_consents" (
    "id" VARCHAR(128) PRIMARY KEY,
    "user_id" VARCHAR(128) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('granted', 'withdrawn')),
    "policy_version" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ,
    "withdrawn_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "privacy_consents_user_purpose_unique" UNIQUE ("user_id", "purpose")
);

CREATE INDEX IF NOT EXISTS "idx_privacy_consents_user_id" ON "privacy_consents" ("user_id");

-- 2. Create Privacy Requests Table (DPDP Section 13 Grievance Redressal)
CREATE TABLE IF NOT EXISTS "privacy_requests" (
    "id" VARCHAR(128) PRIMARY KEY,
    "user_id" VARCHAR(128) NOT NULL,
    "request_type" TEXT NOT NULL CHECK ("request_type" IN ('access', 'correct', 'delete', 'withdraw', 'question', 'complaint', 'other')),
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted' CHECK ("status" IN ('submitted', 'under_review', 'needs_information', 'resolved', 'rejected')),
    "response_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_privacy_requests_user_id" ON "privacy_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_privacy_requests_status" ON "privacy_requests" ("status");

-- 3. Create Nominees Table (DPDP Section 14 Nomination)
CREATE TABLE IF NOT EXISTS "nominees" (
    "id" VARCHAR(128) PRIMARY KEY,
    "user_id" VARCHAR(128) NOT NULL UNIQUE,
    "nominee_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "special_instructions" TEXT,
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_nominees_user_id" ON "nominees" ("user_id");

-- 4. Create Privacy Audit Events Table
-- Non-financial audit trail. Transaction amounts and notes MUST NOT be stored here.
CREATE TABLE IF NOT EXISTS "privacy_audit_events" (
    "id" VARCHAR(128) PRIMARY KEY,
    "user_id" VARCHAR(128) NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_privacy_audit_user_id" ON "privacy_audit_events" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_privacy_audit_action" ON "privacy_audit_events" ("action");

-- 5. Create Policy Versions Table
CREATE TABLE IF NOT EXISTS "policy_versions" (
    "version" VARCHAR(32) PRIMARY KEY,
    "effective_date" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial policy version
INSERT INTO "policy_versions" ("version", "effective_date", "summary", "created_at")
VALUES ('v1.0', 'September 2026', 'Initial DPDP-focused privacy notice and data protection controls.', NOW())
ON CONFLICT ("version") DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all privacy tables
ALTER TABLE "privacy_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "privacy_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nominees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "privacy_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policy_versions" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for: privacy_consents
-- Users can only read and modify their own consent records
-- ----------------------------------------------------------------------------
CREATE POLICY "users_read_own_consents"
    ON "privacy_consents"
    FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_consents"
    ON "privacy_consents"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "users_update_own_consents"
    ON "privacy_consents"
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- Policies for: privacy_requests
-- Users can only view their own requests and submit new requests
-- ----------------------------------------------------------------------------
CREATE POLICY "users_read_own_requests"
    ON "privacy_requests"
    FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_requests"
    ON "privacy_requests"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- Policies for: nominees
-- Users can only read, create, update, and delete their own nominee record
-- ----------------------------------------------------------------------------
CREATE POLICY "users_manage_own_nominee"
    ON "nominees"
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- Policies for: privacy_audit_events
-- Users can only read and append audit events for their own account
-- ----------------------------------------------------------------------------
CREATE POLICY "users_read_own_audit_events"
    ON "privacy_audit_events"
    FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_audit_events"
    ON "privacy_audit_events"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- Policies for: policy_versions
-- Policy versions are publicly readable by any authenticated or unauthenticated client
-- ----------------------------------------------------------------------------
CREATE POLICY "anyone_read_policy_versions"
    ON "policy_versions"
    FOR SELECT
    USING (true);

