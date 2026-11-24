import { createPool } from './db.js';
import { createApp } from './app.js';

let pool;
try {
  pool = createPool();
  pool.on('error', () => console.error('Koneksi database tidak tersedia.'));
  const { app, store } = await createApp({
    pool,
    sessionSecret: process.env.SESSION_SECRET,
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:5173',
    isProduction: process.env.NODE_ENV === 'production',
    trustProxy: process.env.TRUST_PROXY === '1',
  });
  const port = Number(process.env.PORT || 3001);
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Backend: http://127.0.0.1:${server.address().port}`);
  });
  server.on('error', async () => {
    console.error('Backend gagal dijalankan. Periksa port yang digunakan.');
    process.exitCode = 1;
    await store.close();
    await pool.end();
  });
  const shutdown = () => {
    server.close(async () => {
      await store.close();
      await pool.end();
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('Backend belum siap. Periksa konfigurasi backend dan jalankan auth:setup serta db:migrate.');
  process.exitCode = 1;
  await pool?.end();
}
