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

async function createTables() {
  const sqlFile = readFileSync(join(__dirname, 'create-tables.sql'), 'utf-8');
  
  // Remove comments and split by semicolon
  const statements = sqlFile
    .split('\n')
    .map(line => line.replace(/--.*$/, '').trim()) // Remove inline comments
    .filter(line => line.length > 0) // Remove empty lines
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^\s*$/));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await sql(statement);
      console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error?.message?.includes('already exists') || error?.code === '42P07') {
        console.log(`⊘ Table already exists (statement ${i + 1})`);
      } else {
        console.error(`✗ Error executing statement ${i + 1}:`, error.message);
        throw error;
      }
    }
  }

  console.log('\nAll tables created successfully!');
}

createTables()
  .then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting up database:', error);
    process.exit(1);
  });
