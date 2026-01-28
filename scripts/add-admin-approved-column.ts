import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function addAdminApprovedColumn() {
  try {
    console.log("Adding admin_approved column to users table...");
    
    // Add the column with default value false
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false NOT NULL;
    `);
    
    console.log("✓ admin_approved column added successfully");
    
    // Update existing admin users to be approved (if you want to keep current admins approved)
    // Uncomment the following if you want to auto-approve existing admins:
    // await db.execute(sql`
    //   UPDATE users 
    //   SET admin_approved = true 
    //   WHERE is_admin = true;
    // `);
    // console.log("✓ Existing admin users approved");
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addAdminApprovedColumn();
