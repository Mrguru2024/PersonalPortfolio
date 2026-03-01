-- Add payment_plan to client_quotes (30-30-40 or 50-25-25). Safe to run multiple times.
ALTER TABLE client_quotes ADD COLUMN IF NOT EXISTS payment_plan TEXT;
