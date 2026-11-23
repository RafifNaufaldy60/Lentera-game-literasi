import { parseArgs } from 'node:util';
import { normalizeEmail } from '../../shared/auth-validation.js';
import { DatabaseTaskError, runDatabaseTask, setupTransaction } from '../src/database-tasks.js';

await runDatabaseTask('Perubahan role admin', async (client) => {
  let email;
  try {
    const { values } = parseArgs({ options: { email: { type: 'string' } } });
    email = normalizeEmail(values.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error();
  } catch {
    throw new DatabaseTaskError('Gunakan: npm.cmd --prefix server run admin:promote -- --email "nama@example.com"');
  }
  await setupTransaction(client, async () => {
    const result = await client.query("UPDATE public.users SET role = 'admin' WHERE email = $1 AND is_active = TRUE RETURNING id", [email]);
    if (!result.rowCount) throw new DatabaseTaskError('Akun aktif dengan email tersebut tidak ditemukan. Daftarkan akun terlebih dahulu.');
    await client.query("DELETE FROM public.user_sessions WHERE sess->>'userId' = $1", [result.rows[0].id]);
  });
  console.log('Role admin berhasil diterapkan. Silakan masuk kembali.');
});
