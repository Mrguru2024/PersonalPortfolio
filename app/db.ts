import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from '@/shared/schema';
import ws from 'ws';

// For Neon Serverless in the edge runtime
neonConfig.webSocketConstructor = ws;

// Prevent multiple connections in development
let pool: Pool;

export function getDb() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    if (!pool) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }

    return drizzle({ client: pool, schema });
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw new Error('Database connection failed. Please check your configuration.');
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
  }
}

export async function query<T>(
  callback: (db: ReturnType<typeof getDb>) => Promise<T>
): Promise<T> {
  const db = getDb();
  try {
    return await callback(db);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Utility functions
export async function findById<T extends { id: any }>(
  table: any,
  id: any,
): Promise<T | undefined> {
  const db = getDb();
  const [result] = await db
    .select()
    .from(table)
    .where(eq(table.id, id));
  return result as T | undefined;
}

export async function findByField<T>(
  table: any,
  field: any,
  value: any,
): Promise<T | undefined> {
  const db = getDb();
  const [result] = await db
    .select()
    .from(table)
    .where(eq(field, value));
  return result as T | undefined;
}

export async function findAll<T>(table: any): Promise<T[]> {
  const db = getDb();
  return db.select().from(table) as Promise<T[]>;
}