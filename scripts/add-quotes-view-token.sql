-- Add view_token to client_quotes for secure client proposal links (safe to run multiple times).
-- Usage: run via your DB client or: npx tsx scripts/run-add-quotes-view-token.ts

ALTER TABLE client_quotes ADD COLUMN IF NOT EXISTS view_token TEXT UNIQUE;
