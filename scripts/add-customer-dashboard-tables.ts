import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function addCustomerDashboardTables() {
  try {
    console.log("Creating customer dashboard tables...");

    // Client Quotes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS client_quotes (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES project_assessments(id),
        user_id INTEGER REFERENCES users(id),
        quote_number TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        proposal_data JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        valid_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ client_quotes table created");

    // Client Invoices table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS client_invoices (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER REFERENCES client_quotes(id),
        user_id INTEGER REFERENCES users(id),
        invoice_number TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ client_invoices table created");

    // Client Announcements table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS client_announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_active BOOLEAN DEFAULT true,
        target_audience TEXT DEFAULT 'all',
        target_user_ids JSONB,
        target_project_ids JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP
      );
    `);
    console.log("✓ client_announcements table created");

    // Client Feedback table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS client_feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        assessment_id INTEGER REFERENCES project_assessments(id),
        quote_id INTEGER REFERENCES client_quotes(id),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'new',
        admin_response TEXT,
        responded_at TIMESTAMP,
        responded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ client_feedback table created");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addCustomerDashboardTables();
