import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function addFunnelContentTable() {
  try {
    console.log("Creating funnel_content table if not exists...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS funnel_content (
        slug TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✓ funnel_content table ready");
    process.exit(0);
  } catch (error: unknown) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addFunnelContentTable();
