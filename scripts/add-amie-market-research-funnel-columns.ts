import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env.local");

try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch {
  /* optional */
}

import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Aligns `amie_market_research` with shared/amieSchema (CRM link + funnel source).
 * Run: npx tsx scripts/add-amie-market-research-funnel-columns.ts
 */
async function main() {
  console.log("Adding amie_market_research.crm_contact_id and funnel_source if missing…");

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'amie_market_research'
          AND column_name = 'crm_contact_id'
      ) THEN
        ALTER TABLE amie_market_research ADD COLUMN crm_contact_id INTEGER;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'amie_market_research'
          AND column_name = 'funnel_source'
      ) THEN
        ALTER TABLE amie_market_research ADD COLUMN funnel_source TEXT;
      END IF;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_schema = kcu.constraint_schema
          AND tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'amie_market_research'
          AND kcu.column_name = 'crm_contact_id'
          AND tc.constraint_type = 'FOREIGN KEY'
      ) THEN
        ALTER TABLE amie_market_research
          ADD CONSTRAINT amie_market_research_crm_contact_id_fkey
          FOREIGN KEY (crm_contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  console.log("Done. Market Score inserts should succeed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
