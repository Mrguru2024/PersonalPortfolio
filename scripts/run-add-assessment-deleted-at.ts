/**
 * Adds deleted_at column to project_assessments for soft delete / recovery.
 * Usage: npx tsx scripts/run-add-assessment-deleted-at.ts
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
  // optional
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found. Set it in .env.local or the environment.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Adding deleted_at to project_assessments...");
  await sql("ALTER TABLE project_assessments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
