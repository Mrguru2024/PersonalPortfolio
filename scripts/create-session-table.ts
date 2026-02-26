/**
 * Creates the "session" table required by connect-pg-simple.
 * Run this if you see: [setSession] Error storing session ... ENOENT ... table.sql
 *
 * Usage: npx tsx scripts/create-session-table.ts
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
    console.log('Creating "session" table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
    console.log('✓ Session table ready. Log out and log back in to create a session.');
    process.exit(0);
  } catch (e: any) {
    console.error("Failed:", e?.message || e);
    process.exit(1);
  }
}

main();
