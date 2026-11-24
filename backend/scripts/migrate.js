import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseTaskError, runDatabaseTask, setupTransaction } from '../src/database-tasks.js';

const directory = new URL('../migrations/', import.meta.url);

await runDatabaseTask('Migrasi', async (client) => {
  const files = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  const migrations = await Promise.all(files.map(async (filename) => {
    const sql = (await readFile(new URL(filename, directory), 'utf8')).replace(/\r\n?/g, '\n');
    return { filename, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  }));

  if (!migrations.length) throw new DatabaseTaskError('Tidak ada file migrasi SQL.');

  const applied = await setupTransaction(client, async () => {
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const history = await client.query('SELECT filename, checksum FROM public.schema_migrations');
    const known = new Map(history.rows.map((row) => [row.filename, row.checksum]));
    if (history.rows.some((row) => !files.includes(row.filename))) {
      throw new DatabaseTaskError('File migrasi yang pernah diterapkan tidak ditemukan.');
    }
    const changed = [];
    for (const migration of migrations) {
      if (known.has(migration.filename)) {
        if (known.get(migration.filename) !== migration.checksum) {
          throw new DatabaseTaskError(`Isi migrasi ${migration.filename} telah berubah. Buat migrasi baru.`);
        }
        continue;
      }
      await client.query(migration.sql);
      await client.query('INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)', [migration.filename, migration.checksum]);
      changed.push(migration.filename);
    }
    return changed;
  });

  console.log(applied.length ? `Migrasi diterapkan: ${applied.join(', ')}` : 'Migrasi sudah diterapkan; tidak ada perubahan.');
});
