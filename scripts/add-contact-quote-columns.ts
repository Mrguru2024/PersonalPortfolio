import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { neon } from "@neondatabase/serverless";

// Load environment variables from .env.local
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
      if (key === "DATABASE_URL") {
        databaseUrl = value;
      }
      process.env[key] = value;
    }
  });
  console.log("Loaded environment variables from .env.local");
} catch (error) {
  console.warn("Could not load .env.local file:", error);
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function addContactQuoteColumns() {
  const sqlFile = readFileSync(
    join(__dirname, "add-contact-quote-columns.sql"),
    "utf-8"
  );

  console.log("Adding quote fields to contacts table...");

  try {
    await sql(sqlFile);
    console.log("✓ Contact quote columns added successfully!");
  } catch (error: any) {
    console.error("✗ Error adding contact quote columns:", error.message);
    throw error;
  }
}

addContactQuoteColumns()
  .then(() => {
    console.log("Database update complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error updating database:", error);
    process.exit(1);
  });
