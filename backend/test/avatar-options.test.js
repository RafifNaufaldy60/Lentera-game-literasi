import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { acceptedPlayerAvatarKeys, defaultPlayerAvatarKey, legacyAvatarAliases, playerAvatars, resolvePlayerAvatar } from '../shared/avatar-options.js';

test('tujuh avatar WebP tersedia dan memiliki ID berbeda', () => {
  assert.equal(playerAvatars.length, 7);
  assert.equal(new Set(playerAvatars.map(({ key }) => key)).size, 7);
  for (const avatar of playerAvatars) {
    assert.ok(acceptedPlayerAvatarKeys.includes(avatar.key));
    assert.ok(existsSync(fileURLToPath(new URL(`../../frontend/public${avatar.src}`, import.meta.url))), `Missing file ${avatar.src}`);
  }
});

test('avatar lama tetap dapat ditampilkan tanpa mengubah data pengguna', () => {
  for (const [oldKey, modernKey] of Object.entries(legacyAvatarAliases)) {
    assert.ok(acceptedPlayerAvatarKeys.includes(oldKey));
    assert.equal(resolvePlayerAvatar(oldKey).key, modernKey);
  }
  assert.equal(resolvePlayerAvatar('unexpected-value').key, defaultPlayerAvatarKey);
});
