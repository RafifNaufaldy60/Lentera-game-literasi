import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/passwords.js';

test('password memakai salt acak dan dapat diverifikasi tanpa menyimpan teks aslinya', async () => {
  const password = 'Kata sandi khusus pengujian';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('Password yang salah', first), false);
});

test('menolak password kosong dan format hash yang tidak dikenal', async () => {
  await assert.rejects(() => hashPassword(''), TypeError);
  assert.equal(await verifyPassword('contoh', 'plaintext'), false);
  assert.equal(await verifyPassword('contoh', 'scrypt$999999999$8$1$invalid$invalid'), false);
  assert.equal(await verifyPassword(null, null), false);
});
