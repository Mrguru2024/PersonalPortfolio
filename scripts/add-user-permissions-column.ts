import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function addPermissionsColumn() {
  try {
    console.log("Adding permissions column to users table...");
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS permissions JSONB;
    `);
    console.log("✓ permissions column added successfully");
    process.exit(0);
  } catch (error: unknown) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addPermissionsColumn();
