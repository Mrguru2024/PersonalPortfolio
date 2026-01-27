import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
  console.log('Loaded environment variables from .env.local');
} catch (error) {
  console.error('Could not load .env.local file:', error);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('Generating migrations...');
try {
  execSync('npx drizzle-kit generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Migrations generated successfully!');
} catch (error) {
  console.error('Error generating migrations:', error);
  process.exit(1);
}

console.log('\nTo apply migrations, you can use drizzle-kit migrate or apply them manually.');
console.log('For now, please run: npm run db:push');
console.log('When prompted, select "create table" for all tables.');
