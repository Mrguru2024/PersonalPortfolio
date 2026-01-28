import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Script to add password reset columns to users table
 * Run with: tsx scripts/add-password-reset-columns.ts
 */

async function addPasswordResetColumns() {
  try {
    console.log("Adding password reset columns to users table...");
    
    // Add reset_token column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='reset_token'
        ) THEN
          ALTER TABLE users ADD COLUMN reset_token TEXT;
        END IF;
      END $$;
    `);
    
    // Add reset_token_expiry column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='reset_token_expiry'
        ) THEN
          ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        END IF;
      END $$;
    `);
    
    console.log("✅ Password reset columns added to users table");
    console.log("✅ Password reset setup complete!");
    
  } catch (error) {
    console.error("Error adding password reset columns:", error);
    throw error;
  }
}

addPasswordResetColumns()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
