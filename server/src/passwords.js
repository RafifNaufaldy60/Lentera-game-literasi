import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const parameters = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const format = /^scrypt\$131072\$8\$1\$([0-9a-f]{32})\$([0-9a-f]{128})$/;

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password harus berupa teks yang tidak kosong.');
  }
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, 64, parameters);
  return `scrypt$131072$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const match = format.exec(storedHash);
  if (!match) return false;
  const key = await deriveKey(password, Buffer.from(match[1], 'hex'), 64, parameters);
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}
