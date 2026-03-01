/**
 * Adds view_token column to client_quotes for secure proposal links.
 * Usage: npx tsx scripts/run-add-quotes-view-token.ts
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
  console.log("Adding view_token to client_quotes...");
  await sql("ALTER TABLE client_quotes ADD COLUMN IF NOT EXISTS view_token TEXT UNIQUE");
  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
