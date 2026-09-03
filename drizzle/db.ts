import { config } from 'dotenv';
import dns from 'node:dns';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Resilient DNS fallback:
// If the local Wi-Fi router or ISP resolver fails with ENOTFOUND/EREFUSED on external cloud
// database endpoints, automatically fall back to public DNS (8.8.8.8, 1.1.1.1).
const globalForDns = globalThis as unknown as { _dnsPatched?: boolean };
if (!globalForDns._dnsPatched) {
  const originalLookup = dns.lookup;
  const resolver = new dns.promises.Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  dns.lookup = function (hostname: string, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    originalLookup(hostname, options, (err, address, family) => {
      if (!err) {
        return callback(null, address, family);
      }
      // Attempt fallback to reliable public DNS resolvers
      resolver
        .resolve4(hostname)
        .then((ips) => {
          if (ips && ips.length > 0) {
            if (options && options.all) {
              callback(
                null,
                ips.map((ip) => ({ address: ip, family: 4 }))
              );
            } else {
              callback(null, ips[0], 4);
            }
          } else {
            callback(err);
          }
        })
        .catch(() => callback(err));
    });
  };
  globalForDns._dnsPatched = true;
}

// Ensure env variables are loaded when running scripts/migrations outside of Next.js
if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
  config({ path: '.env' });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required but was not provided.');
}

// Singleton pool — reused across hot-reloads in dev.
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
