-- Add quote-related fields to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS budget TEXT,
  ADD COLUMN IF NOT EXISTS timeframe TEXT,
  ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pricing_estimate JSONB;
