import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file:', error);
}

import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Script to add analytics columns to blog_posts table and create blog_post_views table
 * Run with: tsx scripts/add-blog-analytics-columns.ts
 */

async function addBlogAnalyticsColumns() {
  try {
    console.log("Adding analytics columns to blog_posts table...");
    
    // Add view_count column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='blog_posts' AND column_name='view_count'
        ) THEN
          ALTER TABLE blog_posts ADD COLUMN view_count INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    
    // Add unique_view_count column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='blog_posts' AND column_name='unique_view_count'
        ) THEN
          ALTER TABLE blog_posts ADD COLUMN unique_view_count INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    
    console.log("✅ Analytics columns added to blog_posts table");
    
    // Create blog_post_views table
    console.log("Creating blog_post_views table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_post_views (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        viewed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        max_scroll_depth INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        read_complete BOOLEAN DEFAULT false,
        scroll_events JSONB,
        last_activity_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create index for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_blog_post_views_session_id ON blog_post_views(session_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON blog_post_views(viewed_at);
    `);
    
    console.log("✅ blog_post_views table created with indexes");
    console.log("✅ Blog analytics setup complete!");
    
  } catch (error) {
    console.error("Error adding blog analytics columns:", error);
    throw error;
  }
}

addBlogAnalyticsColumns()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
