import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@/shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Pool of database connections that can be reused
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Drizzle ORM database instance
 */
export const db = drizzle(pool, { schema });

/**
 * Helper function to close the database connection pool
 * Call this when shutting down the application
 */
export async function closeDb() {
  await pool.end();
}

/**
 * Execute a SQL query with parameters
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 */
export async function query<T>(text: string, params?: any[]): Promise<T> {
  try {
    const result = await pool.query(text, params);
    return result.rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Find a record by ID
 * @param table Table name
 * @param id Record ID
 * @returns Record or undefined
 */
export async function findById<T extends { id: any }>(
  table: string, 
  id: string | number
): Promise<T | undefined> {
  const [record] = await query<T[]>(`SELECT * FROM ${table} WHERE id = $1 LIMIT 1`, [id]);
  return record;
}

/**
 * Find records by a specific field value
 * @param table Table name
 * @param field Field name
 * @param value Field value
 * @returns Array of records
 */
export async function findByField<T>(
  table: string,
  field: string,
  value: any
): Promise<T[]> {
  return query<T[]>(`SELECT * FROM ${table} WHERE ${field} = $1`, [value]);
}

/**
 * Find all records in a table
 * @param table Table name
 * @returns Array of records
 */
export async function findAll<T>(table: string): Promise<T[]> {
  return query<T[]>(`SELECT * FROM ${table}`);
}