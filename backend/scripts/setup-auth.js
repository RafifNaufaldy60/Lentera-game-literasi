import { randomBytes } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { parse } from 'dotenv';

try {
  const path = new URL('../.env', import.meta.url);
  const content = await readFile(path, 'utf8');
  const settings = parse(content);
  if (settings.SESSION_SECRET) {
    if (settings.SESSION_SECRET.length < 32) throw new Error('invalid-secret');
    console.log('SESSION_SECRET sudah tersedia; tidak diubah.');
  } else {
    const separator = content.endsWith('\n') ? '' : '\n';
    await appendFile(path, `${separator}SESSION_SECRET=${randomBytes(48).toString('base64url')}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log('SESSION_SECRET dibuat dan disimpan hanya di backend/.env.');
  }
} catch {
  console.error('Konfigurasi sesi gagal. Pastikan backend/.env tersedia dan SESSION_SECRET yang sudah ada berisi minimal 32 karakter.');
  process.exitCode = 1;
}
