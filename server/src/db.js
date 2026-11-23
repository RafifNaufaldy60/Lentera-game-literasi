import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

export function createPool() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL belum diatur.');
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL tidak valid.');
  }

  databaseUrl.searchParams.set('sslmode', 'verify-full');

  return new pg.Pool({
    connectionString: databaseUrl.toString(),
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
}

export async function checkConnection(pool) {
  const { rows } = await pool.query('SELECT current_database() AS database_name');
  return rows[0].database_name;
}
