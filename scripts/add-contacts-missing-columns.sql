-- Add any missing columns to contacts (safe to run multiple times).
-- Run this if you see: column "phone" (or others) does not exist.
-- Usage: run via your DB client or: npx tsx scripts/run-add-contacts-missing-columns.ts

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timeframe TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pricing_estimate JSONB;
