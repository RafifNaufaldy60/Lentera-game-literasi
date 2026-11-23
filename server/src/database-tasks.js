import { createPool } from './db.js';

export class DatabaseTaskError extends Error {}

export async function runDatabaseTask(label, task) {
  let pool;
  let client;

  try {
    pool = createPool();
    client = await pool.connect();
    await task(client);
  } catch (error) {
    const code = /^[A-Z0-9_]+$/.test(error.code ?? '') ? ` (${error.code})` : '';
    console.error(`${label}: gagal${code}.`);
    if (error instanceof DatabaseTaskError) console.error(error.message);
    process.exitCode = 1;
  } finally {
    client?.release();
    await pool?.end();
  }
}

export async function setupTransaction(client, task) {
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query('SELECT pg_advisory_xact_lock(21831, 1)');
    const result = await task();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
