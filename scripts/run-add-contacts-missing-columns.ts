/**
 * Adds missing columns to the contacts table (phone, subject, company, etc.).
 * Run if you see: column "phone" does not exist.
 * Usage: npx tsx scripts/run-add-contacts-missing-columns.ts
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env.local");

let databaseUrl = process.env.DATABASE_URL;
try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (key === "DATABASE_URL") databaseUrl = value;
      process.env[key] = value;
    }
  });
} catch {
  // .env.local optional if DATABASE_URL already set
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found. Set it in .env.local or the environment.");
  process.exit(1);
}

const sql = neon(databaseUrl);

const statements = [
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT ''",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS project_type TEXT",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS budget TEXT",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timeframe TEXT",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false",
  "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pricing_estimate JSONB",
];

async function main() {
  console.log("Adding missing columns to contacts table...");
  for (const statement of statements) {
    try {
      await sql(statement);
      const col = statement.replace(/.*ADD COLUMN IF NOT EXISTS (\S+).*/, "$1");
      console.log("  ✓", col);
    } catch (err: any) {
      console.error("  ✗", err?.message || err);
    }
  }
  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
