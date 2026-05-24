-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Add missing columns to align schema with the frontend
--
-- Run this ONCE against the existing Railway (production) database.
-- All statements use IF NOT EXISTS / IGNORE so re-running is safe.
-- Order matters: add columns before updating defaults or data.
-- ─────────────────────────────────────────────────────────────────────────────

USE zero_hunger;

-- ─── families ────────────────────────────────────────────────────────────────

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS household_id          VARCHAR(50)   NULL          AFTER barangay_id,
  ADD COLUMN IF NOT EXISTS monthly_income        DECIMAL(12,2) NULL          AFTER phone,
  ADD COLUMN IF NOT EXISTS food_assistance_status VARCHAR(255) NOT NULL DEFAULT 'None' AFTER monthly_income,
  ADD COLUMN IF NOT EXISTS is_npa                TINYINT(1)    NOT NULL DEFAULT 0 AFTER food_assistance_status,
  ADD COLUMN IF NOT EXISTS priority_score        INT           NOT NULL DEFAULT 0 AFTER is_npa,
  ADD COLUMN IF NOT EXISTS is_active             TINYINT(1)    NOT NULL DEFAULT 1 AFTER priority_score,
  ADD COLUMN IF NOT EXISTS image                 LONGBLOB      NULL          AFTER is_active,
  ADD COLUMN IF NOT EXISTS created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER image;

-- ─── family_members ──────────────────────────────────────────────────────────
-- Replace the old `age` column (integer) with `date_of_birth` (date).
-- We keep `age` temporarily so existing data isn't lost; it can be dropped
-- after a data-migration step if needed.

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS date_of_birth      DATE         NULL         AFTER last_name,
  ADD COLUMN IF NOT EXISTS relationship       VARCHAR(50)  NOT NULL DEFAULT 'Other' AFTER gender,
  ADD COLUMN IF NOT EXISTS is_pwd             TINYINT(1)   NOT NULL DEFAULT 0 AFTER relationship,
  ADD COLUMN IF NOT EXISTS height_cm          DECIMAL(5,2) NULL         AFTER is_pwd,
  ADD COLUMN IF NOT EXISTS weight_kg          DECIMAL(5,2) NULL         AFTER height_cm,
  ADD COLUMN IF NOT EXISTS nutritional_status VARCHAR(50)  NOT NULL DEFAULT 'Unknown' AFTER weight_kg;

-- ─── individuals ─────────────────────────────────────────────────────────────

ALTER TABLE individuals
  ADD COLUMN IF NOT EXISTS date_of_birth DATE      NULL AFTER name,
  ADD COLUMN IF NOT EXISTS image         LONGBLOB  NULL AFTER status,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER image;

-- ─── distribution ────────────────────────────────────────────────────────────

ALTER TABLE distribution
  ADD COLUMN IF NOT EXISTS distribution_type VARCHAR(20) NOT NULL DEFAULT 'Food' AFTER barangay_id,
  ADD COLUMN IF NOT EXISTS image LONGBLOB NULL AFTER status;

-- ─── donations ───────────────────────────────────────────────────────────────

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS image LONGBLOB NULL AFTER date_given;

-- ─── users ───────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER barangay_id;

-- ─── barangays: ensure all 10 are present with correct names ─────────────────

INSERT IGNORE INTO barangays (name) VALUES
  ('Aguho'),
  ('Magtanggol'),
  ("Martires del '96"),
  ('Poblacion'),
  ('San Pedro'),
  ('San Roque'),
  ('Santa Ana'),
  ('Santo Rosario-Kanluran'),
  ('Santo Rosario-Silangan'),
  ('Tabacalera');

-- Fix the name for barangay 3 if it was seeded without the apostrophe
UPDATE barangays SET name = "Martires del '96" WHERE name = 'Martires del 96';
