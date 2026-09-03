import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local first, fallback to .env
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
