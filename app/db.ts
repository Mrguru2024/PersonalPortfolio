import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a Drizzle instance
export const db = drizzle(pool, { schema });

// Export types for use in the app
export type { 
  User, 
  Project, 
  Skill, 
  SkillEndorsement,
  Contact,
  ResumeRequest,
  BlogPost,
  BlogComment,
  BlogPostContribution
} from '../shared/schema';