-- =============================================================================
-- Migration: 001_create_scholarship_bid_applications.sql
-- Description: Schema for Public Sector Overseas Training Nominations under
--              General Order 6 with Automated Compliance Engine Audit Records.
-- Author: PNG Department of Personnel Management (DPM) Engineering
-- Target DB: PostgreSQL 14+
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE program_duration_enum AS ENUM ('Short-term', 'Long-term');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE highest_qualification_enum AS ENUM (
        'High School',
        'Certificate',
        'Diploma',
        'Bachelor',
        'Postgraduate',
        'Master',
        'PhD'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE candidate_gender_enum AS ENUM ('Male', 'Female');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE assessment_decision_enum AS ENUM (
        'Meets all requirements',
        'Does not meet most of the requirements'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'AUTO_REJECTED',
        'AUTO_QUALIFIED',
        'DPM_ENDORSED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mandatory_attachment_type_enum AS ENUM (
        'agency_cover_letter',
        'highest_qualification_transcript',
        'certification_validity',
        'reintegration_plan',
        'form_pat_4_5_tc_decision_form'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- -----------------------------------------------------------------------------
-- 2. MAIN APPLICATION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_bid_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(64) NOT NULL UNIQUE,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status application_status_enum NOT NULL DEFAULT 'SUBMITTED',

    -- SECTION 1: Application Metadata & Candidate Profile
    candidate_family_name VARCHAR(100) NOT NULL,
    candidate_other_names VARCHAR(150) NOT NULL,
    employee_no VARCHAR(50) NOT NULL,
    nid_no VARCHAR(50),
    department_or_agency VARCHAR(200) NOT NULL,
    substantive_position VARCHAR(150) NOT NULL,
    public_servant_status BOOLEAN NOT NULL DEFAULT TRUE,
    permanent_public_servant BOOLEAN NOT NULL DEFAULT TRUE,
    program_duration program_duration_enum NOT NULL,
    highest_qualification highest_qualification_enum NOT NULL,
    gender candidate_gender_enum NOT NULL,
    date_of_birth DATE NOT NULL,
    proposed_course_title VARCHAR(255) NOT NULL,
    proposed_institution VARCHAR(255) NOT NULL,
    proposed_country VARCHAR(100) NOT NULL,
    available_in_png_institutions BOOLEAN NOT NULL DEFAULT FALSE,
    matched_local_course_id VARCHAR(64),

    -- SECTION 3: Eligibility & Compliance Criteria (Calculated Boolean Flags)
    relevant_qualification_acquired BOOLEAN NOT NULL DEFAULT TRUE,
    completed_two_year_gap BOOLEAN NOT NULL DEFAULT TRUE,
    directly_relevant_to_duties BOOLEAN NOT NULL DEFAULT TRUE,
    falls_under_govt_priority BOOLEAN NOT NULL DEFAULT FALSE,
    endorsed_by_dtc BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_head_or_delegate BOOLEAN NOT NULL DEFAULT FALSE,

    -- Endorsement Tokens & Sign-off Verification
    dtc_endorsement_token VARCHAR(255),
    dtc_endorsement_date DATE,
    agency_head_approval_token VARCHAR(255),
    agency_head_approval_date DATE,

    -- SECTION 4: Assessment Verdict & Automated Audit Sign-off
    assessment_decision assessment_decision_enum NOT NULL,
    assessment_reasons TEXT,
    system_verification_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    compliance_hash CHAR(64) NOT NULL,
    automated_rule_pass_flags JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_date_of_birth_realistic CHECK (date_of_birth < CURRENT_DATE - INTERVAL '18 years'),
    CONSTRAINT chk_assessment_reasons_presence CHECK (
        assessment_decision != 'Does not meet most of the requirements' 
        OR (assessment_reasons IS NOT NULL AND LENGTH(TRIM(assessment_reasons)) > 0)
    )
);

-- Indexing for high-throughput lookup & filtering
CREATE INDEX IF NOT EXISTS idx_scholarship_ref_num ON scholarship_bid_applications(reference_number);
CREATE INDEX IF NOT EXISTS idx_scholarship_status ON scholarship_bid_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_employee_no ON scholarship_bid_applications(employee_no);
CREATE INDEX IF NOT EXISTS idx_scholarship_decision ON scholarship_bid_applications(assessment_decision);
CREATE INDEX IF NOT EXISTS idx_scholarship_submission_date ON scholarship_bid_applications(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_scholarship_compliance_hash ON scholarship_bid_applications(compliance_hash);

-- -----------------------------------------------------------------------------
-- 3. MANDATORY ATTACHMENTS & DOCUMENT INTEGRITY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES scholarship_bid_applications(id) ON DELETE CASCADE,
    attachment_type mandatory_attachment_type_enum NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    sha256_checksum CHAR(64),
    document_issue_date DATE, -- specifically parsed for certification_validity 2-year check
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_app_attachment_type UNIQUE (application_id, attachment_type)
);

CREATE INDEX IF NOT EXISTS idx_attachments_app_id ON scholarship_attachments(application_id);

-- -----------------------------------------------------------------------------
-- 4. PRIOR ACADEMIC TRAINING HISTORY TABLE (For 2-Year Stand-down Calculation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_prior_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES scholarship_bid_applications(id) ON DELETE CASCADE,
    program_title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL CHECK (duration_months > 0),
    start_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    funding_source VARCHAR(150),
    qualification_awarded VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prior_training_app_id ON scholarship_prior_training(application_id);

-- -----------------------------------------------------------------------------
-- 5. AUTOMATED COMPLIANCE ENGINE AUDIT TRAIL LOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES scholarship_bid_applications(id) ON DELETE CASCADE,
    rule_code VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    rule_title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('FATAL', 'WARNING', 'INFO')),
    failure_reason TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_app_id ON scholarship_compliance_audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_rule_code ON scholarship_compliance_audit_logs(rule_code);

-- -----------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_scholarship_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_scholarship_timestamp ON scholarship_bid_applications;
CREATE TRIGGER trg_update_scholarship_timestamp
    BEFORE UPDATE ON scholarship_bid_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_scholarship_timestamp();

COMMIT;

