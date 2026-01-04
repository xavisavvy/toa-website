import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import * as schema from '../shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set. Order tracking will not be available.');
}

// Create pool only if DATABASE_URL is provided
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

// Export db - will be null if DATABASE_URL not configured
export const db = pool ? drizzle(pool, { schema }) : null as any;
