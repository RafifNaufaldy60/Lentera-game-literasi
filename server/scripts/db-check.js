import { checkConnection, createPool } from '../src/db.js';

let pool;
let databaseName;

try {
  pool = createPool();
  databaseName = await checkConnection(pool);
} catch {
  process.exitCode = 1;
} finally {
  try {
    await pool?.end();
  } catch {
    process.exitCode = 1;
  }
}

if (process.exitCode === 1) {
  console.error('Status koneksi: gagal');
  console.error('Nama database: -');
} else {
  console.log('Status koneksi: berhasil');
  console.log(`Nama database: ${databaseName}`);
}
