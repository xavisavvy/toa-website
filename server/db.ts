import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set. Order tracking will not be available.');
}

// Create connection - works with both Neon and standard PostgreSQL
let queryClient = null;
if (DATABASE_URL) {
  try {
    queryClient = postgres(DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Add onnotice to suppress notices
      onnotice: () => {},
    });
  } catch (error) {
    console.error('❌ Failed to create database connection:', error);
    console.error('DATABASE_URL format:', DATABASE_URL.replace(/:[^:@]+@/, ':***@')); // Mask password
  }
}

// Export db - will be null if DATABASE_URL not configured or connection failed
export const db = queryClient ? drizzle(queryClient, { schema }) : null as any;
