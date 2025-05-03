import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections from growing exponentially
// during API Route usage.
declare global {
  var pool: Pool | undefined;
  var db: any;
}

let pool: Pool;
let db: any;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  if (!global.pool) {
    global.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    global.db = drizzle(global.pool, { schema });

    // Auto-apply migrations in development (optional)
    // migrate(global.db, { migrationsFolder: './drizzle' })
    //  .then(() => console.log('Migrations applied'))
    //  .catch(console.error);
  }
  pool = global.pool;
  db = global.db;
}

export function getDb() {
  if (!pool || !db) {
    throw new Error('Database not initialized');
  }
  return { pool, db };
}

export async function closeDb() {
  if (pool) {
    await pool.end();
  }
}