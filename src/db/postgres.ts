import { Pool } from "pg";

let pool: Pool | null = null;

export async function initPostgres(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // Decide whether to enable SSL for the Postgres pool. Hosted providers
  // (Render, Supabase, Heroku) typically require TLS. We enable SSL when
  // any of the following is true:
  // - NODE_ENV === 'production'
  // - DB_SSL === 'true' (explicit opt-in)
  // - PGSSLMODE === 'require' or the DATABASE_URL contains 'sslmode=require'
  const useSsl =
    process.env.DB_SSL === "true" ||
    process.env.PGSSLMODE === "require" ||
    url.includes("sslmode=require") ||
    process.env.NODE_ENV === "production";

  const poolConfig: any = { connectionString: url };
  if (useSsl) {
    // Many managed Postgres providers use certificates we don't ship locally.
    // Setting rejectUnauthorized: false is a pragmatic choice for apps that
    // don't validate server certs locally. If you need strict verification,
    // provide a proper CA via environment/config.
    poolConfig.ssl = { rejectUnauthorized: false } as any;
    console.log("Postgres SSL enabled for connection");
  } else {
    console.log("Postgres SSL not enabled for connection");
  }

  pool = new Pool(poolConfig);

  // simple connection test
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("Connected to Postgres");
  } finally {
    client.release();
  }
}

export function getPostgresPool(): Pool {
  if (!pool) throw new Error("Postgres pool not initialized");
  return pool;
}
