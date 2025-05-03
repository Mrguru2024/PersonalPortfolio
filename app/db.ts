import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@/shared/schema';

// If there's no DATABASE_URL environment variable, throw an error
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool to PostgreSQL
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle ORM instance with the connection and schema
export const db = drizzle(pool, { schema });

// Export the schema as well for convenience
export { schema };