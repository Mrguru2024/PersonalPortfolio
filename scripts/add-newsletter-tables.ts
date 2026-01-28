import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Script to create newsletter tables
 * Run with: tsx scripts/add-newsletter-tables.ts
 */

async function addNewsletterTables() {
  try {
    console.log("Creating newsletter_subscribers table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        subscribed BOOLEAN DEFAULT true NOT NULL,
        subscribed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        unsubscribed_at TIMESTAMP,
        source TEXT,
        tags JSONB,
        metadata JSONB
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed ON newsletter_subscribers(subscribed);
    `);
    
    console.log("✅ newsletter_subscribers table created");
    
    console.log("Creating newsletters table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS newsletters (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        plain_text TEXT,
        preview_text TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by INTEGER,
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        recipient_filter JSONB,
        images JSONB
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);
    `);
    
    console.log("✅ newsletters table created");
    
    console.log("Creating newsletter_sends table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS newsletter_sends (
        id SERIAL PRIMARY KEY,
        newsletter_id INTEGER NOT NULL,
        subscriber_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        brevo_message_id TEXT
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber_id ON newsletter_sends(subscriber_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status ON newsletter_sends(status);
    `);
    
    console.log("✅ newsletter_sends table created");
    console.log("✅ Newsletter tables setup complete!");
    
  } catch (error) {
    console.error("Error creating newsletter tables:", error);
    throw error;
  }
}

addNewsletterTables()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
