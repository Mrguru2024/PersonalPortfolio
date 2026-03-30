import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? "";
const isLocalDatabase =
  databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

if (isLocalDatabase) {
  neonConfig.wsProxy = () =>
    process.env.NEON_WS_PROXY?.trim() || "localhost:443/v2";
  neonConfig.useSecureWebSocket =
    parseBooleanEnv(process.env.NEON_WS_PROXY_SECURE) ?? true;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

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

let _pool: NeonPool | PgPool | null = null;
let _db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon> | null = null;

function getPool(): NeonPool | PgPool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    
    // Use standard pg driver for local development
    if (isLocalDatabase) {
      console.log('[server/db] Using standard pg driver for local database');
      _pool = new PgPool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 8000,
      });
      return _pool;
    }
    
    // Use Neon driver for production
    const raw = new NeonPool({
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
    const poolInstance = getPool();
    if (isLocalDatabase) {
      _db = drizzlePg(poolInstance as PgPool, { schema });
    } else {
      _db = drizzleNeon({ client: poolInstance as NeonPool, schema });
    }
  }
  return _db;
}

export const pool = new Proxy({} as NeonPool | PgPool, {
  get(_target, prop) {
    const poolInstance = getPool();
    const value = (poolInstance as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    return value;
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon>, {
  get(_target, prop) {
    const dbInstance = getDb();
    const value = (dbInstance as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    return value;
  }
});
