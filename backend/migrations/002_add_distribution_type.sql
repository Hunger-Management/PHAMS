-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002 — Add distribution_type to support Food and Monetary records
-- Run this once on existing databases.
-- ─────────────────────────────────────────────────────────────────────────────

USE zero_hunger;

ALTER TABLE distribution
  ADD COLUMN IF NOT EXISTS distribution_type VARCHAR(20) NOT NULL DEFAULT 'Food' AFTER barangay_id;

UPDATE distribution
SET distribution_type = 'Food'
WHERE distribution_type IS NULL OR distribution_type = '';