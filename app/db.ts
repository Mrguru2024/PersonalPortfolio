import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@/shared/schema";
import { asc, desc, eq, and, or, sql } from 'drizzle-orm';

let pool: Pool;

/**
 * Initializes and returns the database connection pool
 */
export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set in environment");
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  
  return drizzle({ client: pool, schema });
}

/**
 * Closes the database connection pool
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
  }
}

/**
 * Executes a SQL query with parameters
 */
export async function query<T>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = getDb();
  const result = await db.execute(sql, params);
  return result.rows as T[];
}

/**
 * Finds a record by ID
 */
export async function findById<T extends { id: any }>(
  table: any,
  id: any
): Promise<T | undefined> {
  const db = getDb();
  const [record] = await db.select().from(table).where(eq(table.id, id));
  return record;
}

/**
 * Finds records by a specific field value
 */
export async function findByField<T>(
  table: any,
  field: any,
  value: any
): Promise<T[]> {
  const db = getDb();
  return db.select().from(table).where(eq(field, value));
}

/**
 * Finds all records in a table
 */
export async function findAll<T>(table: any): Promise<T[]> {
  const db = getDb();
  return db.select().from(table);
}