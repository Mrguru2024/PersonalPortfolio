import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

/** Convert ErrorEvent or getter-only errors to a plain Error so no code can set .message and throw */
function toPlainError(e: unknown): Error {
  if (e instanceof Error && e.constructor.name === 'Error') return e;
  const msg =
    e != null && typeof (e as { message?: unknown }).message === 'string'
      ? (e as { message: string }).message
      : String(e);
  return new Error(msg);
}

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    const raw = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30_000,
    });
    // Normalize at emit so every listener (including Neon's internal ones) gets a plain Error, never ErrorEvent
    const originalEmit = raw.emit.bind(raw);
    raw.emit = function (event: string, ...args: unknown[]) {
      if (event === 'error' && args.length > 0) {
        return originalEmit(event, toPlainError(args[0]), ...args.slice(1));
      }
      return originalEmit(event, ...args);
    };
    _pool = raw;
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle({ client: getPool(), schema });
  }
  return _db;
}

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
