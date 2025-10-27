import * as schema from "@shared/schema";

// Note: for local development we support a "sqlite://" DATABASE_URL or no DATABASE_URL
// In those cases we export db = undefined and let storage fall back to an in-memory implementation.
let db: any = undefined;
let pool: any = undefined;
let usingNeon = false;

const databaseUrl = process.env.DATABASE_URL || "";

if (databaseUrl && databaseUrl.startsWith("postgres://")) {
  // Lazily import neon serverless and initialize asynchronously.
  // We avoid top-level await so module loads even if Postgres client isn't available.
  import('@neondatabase/serverless')
    .then(({ Pool, neonConfig }) => {
      return Promise.all([
        Promise.resolve({ Pool, neonConfig }),
        import('drizzle-orm/neon-serverless'),
        import('ws')
      ]);
    })
    .then(([_ns, drizzleModule, wsModule]) => {
      const { Pool, neonConfig } = _ns as any;
      const { drizzle } = drizzleModule as any;
      const ws = wsModule as any;
      try {
        neonConfig.webSocketConstructor = ws.default || ws;
        pool = new Pool({ connectionString: databaseUrl });
        db = drizzle(pool, { schema });
        usingNeon = true;
        console.log('Initialized Neon DB connection');
      } catch (err) {
        console.warn('Failed to initialize Neon DB client, falling back to in-memory storage. Error:', err);
        db = undefined;
        pool = undefined;
        usingNeon = false;
      }
    })
    .catch((err) => {
      console.warn('Failed to dynamically import Neon DB client, falling back to in-memory storage. Error:', err);
      db = undefined;
      pool = undefined;
      usingNeon = false;
    });
} else {
  // No Postgres/Neon URL provided — run in in-memory mode
  db = undefined;
  pool = undefined;
  usingNeon = false;
}

export { db, pool, usingNeon };