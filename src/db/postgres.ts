import { Pool } from "pg";

let pool: Pool | null = null;

export async function initPostgres(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  pool = new Pool({ connectionString: url });

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
