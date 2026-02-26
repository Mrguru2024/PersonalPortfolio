/**
 * Adds the "subject" column to contacts if missing (schema expects it).
 * Run once: npx tsx scripts/add-contacts-subject.ts
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env.local");

try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  });
} catch {
  console.warn("No .env.local found; using existing env.");
}

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log('Adding "subject" column to contacts if not exists...');
    await db.execute(sql`
      ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT ''
    `);
    console.log("✓ contacts.subject column ready.");
    process.exit(0);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Failed:", msg);
    process.exit(1);
  }
}

main();
