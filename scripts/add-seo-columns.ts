import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

let databaseUrl = process.env.DATABASE_URL;

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'DATABASE_URL') {
        databaseUrl = value;
      }
      process.env[key] = value;
    }
  });
  console.log('Loaded environment variables from .env.local');
} catch (error) {
  console.warn('Could not load .env.local file:', error);
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function addSeoColumns() {
  const sqlFile = readFileSync(join(__dirname, 'add-seo-columns.sql'), 'utf-8');
  
  console.log('Adding SEO columns to blog_posts table...');
  
  try {
    await sql(sqlFile);
    console.log('✓ SEO columns added successfully!');
  } catch (error: any) {
    console.error('✗ Error adding SEO columns:', error.message);
    throw error;
  }
}

addSeoColumns()
  .then(() => {
    console.log('Database update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating database:', error);
    process.exit(1);
  });
