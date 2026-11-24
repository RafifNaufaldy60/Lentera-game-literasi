import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAuthInput } from '../shared/auth-validation.js';

test('pendaftaran menormalisasi nama/email dan tidak mengambil role dari input', () => {
  const checked = validateAuthInput({ name: '  Sari  ', email: ' SARI@EXAMPLE.INVALID ', password: 'kalimat password panjang', role: 'admin', is_active: false }, true);
  assert.deepEqual(checked.errors, {});
  assert.deepEqual(checked.values, { name: 'Sari', email: 'sari@example.invalid', password: 'kalimat password panjang' });
});

test('isian kosong dan tipe input tidak valid ditolak', () => {
  for (const input of [null, {}, { name: [], email: {}, password: 123 }]) {
    assert.deepEqual(Object.keys(validateAuthInput(input, true).errors), ['name', 'email', 'password']);
  }
});

test('batas password pendaftaran diperiksa tanpa menghapus spasi password', () => {
  const fields = { name: 'Sari', email: 'sari@example.invalid' };
  assert.ok(validateAuthInput({ ...fields, password: 'a'.repeat(14) }, true).errors.password);
  assert.ok(validateAuthInput({ ...fields, password: 'a'.repeat(129) }, true).errors.password);
  assert.equal(validateAuthInput({ ...fields, password: ' panjang dan berspasi ' }, true).values.password, ' panjang dan berspasi ');
});
