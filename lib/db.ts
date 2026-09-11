import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export const db = {
  query: <T extends object = Record<string, unknown>>(text: string, params?: unknown[]) =>
    pool.query<T>(text, params),
};
