import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Ensure env variables are loaded when running scripts/migrations outside of Next.js
if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
  config({ path: '.env' });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required but was not provided.');
}

// Singleton pool — reused across hot-reloads in dev.
// In serverless (Vercel) each invocation gets a fresh module, but the
// pool itself is cheap to create and pg handles connection multiplexing.
const globalForDb = globalThis as unknown as { _pgPool?: Pool };

const pool =
  globalForDb._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Neon / Supabase
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pgPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
