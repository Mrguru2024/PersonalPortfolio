import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle({ client: getPool(), schema });
  }
  return _db;
}

// Lazy initialization - only connect when actually used
// This prevents errors during module import in serverless environments
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const poolInstance = getPool();
    const value = poolInstance[prop as keyof Pool];
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    return value;
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const dbInstance = getDb();
    const value = dbInstance[prop as keyof ReturnType<typeof drizzle>];
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    return value;
  }
});
