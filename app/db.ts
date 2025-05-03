import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@/shared/schema';
import ws from 'ws';

// Required for Neon database serverless connections
neonConfig.webSocketConstructor = ws;

let pool: Pool;

export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  
  return drizzle({ client: pool, schema });
}

export async function closeDb() {
  if (pool) {
    await pool.end();
  }
}