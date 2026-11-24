import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearResourceCache, invalidateAfterMutation, loadResource, prefetchResource,
  resourceSnapshot, subscribeResource,
} from '../src/lib/resource-cache.js';

const originalFetch = globalThis.fetch;
function respond(data, status = 200) {
  return { status, ok: status >= 200 && status < 300, json: async () => data };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test.afterEach(() => {
  clearResourceCache();
  globalThis.fetch = originalFetch;
});

test('navigasi ulang memakai cache dan permintaan bersamaan hanya dikirim sekali', async () => {
  const gate = deferred();
  let requests = 0;
  globalThis.fetch = async () => { requests += 1; return gate.promise; };
  const first = loadResource('/catalog');
  const second = prefetchResource('/catalog');
  assert.equal(requests, 1);
  gate.resolve(respond({ materials: [{ id: 'satu' }] }));
  await Promise.all([first, second]);
  assert.deepEqual(resourceSnapshot('/catalog').data.materials, [{ id: 'satu' }]);
  await loadResource('/catalog');
  assert.equal(requests, 1);
});

test('perubahan konten admin membatalkan cache katalog dan mengambil data terbaru', async () => {
  let requests = 0;
  globalThis.fetch = async () => respond({ materials: [{ id: String(++requests) }] });
  await loadResource('/catalog');
  let notifications = 0;
  const unsubscribe = subscribeResource('/catalog', () => { notifications += 1; });
  invalidateAfterMutation('/admin/materials');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests, 2);
  assert.equal(resourceSnapshot('/catalog').data.materials[0].id, '2');
  assert.ok(notifications > 0);
  unsubscribe();
});

test('cache dihapus saat pergantian akun dan respons akun lama tidak tersimpan', async () => {
  const old = deferred();
  globalThis.fetch = async () => old.promise;
  const pending = loadResource('/game/profile');
  clearResourceCache();
  globalThis.fetch = async () => respond({ profile: { user: 'new' } });
  await loadResource('/game/profile');
  old.resolve(respond({ profile: { user: 'old' } }));
  await pending;
  assert.equal(resourceSnapshot('/game/profile').data.profile.user, 'new');
});

test('mutasi skor tidak boleh menimpa cache dengan respons GET yang lebih lama', async () => {
  const old = deferred();
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return requests === 1 ? old.promise : respond({ attempts: ['updated'] });
  };
  const unsubscribe = subscribeResource('/attempts', () => {});
  const pending = loadResource('/attempts');
  invalidateAfterMutation('/attempts/example/choices');
  old.resolve(respond({ attempts: ['old'] }));
  await pending;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests, 2);
  assert.deepEqual(resourceSnapshot('/attempts').data.attempts, ['updated']);
  unsubscribe();
});

test('gagal memperbarui cache tetap mempertahankan data yang sudah dimuat', async () => {
  globalThis.fetch = async () => respond({ chapters: [1, 2] });
  await loadResource('/game/chapters');
  globalThis.fetch = async () => { throw new Error('Network failure'); };
  await assert.rejects(loadResource('/game/chapters', { force: true }));
  assert.deepEqual(resourceSnapshot('/game/chapters').data.chapters, [1, 2]);
  assert.equal(resourceSnapshot('/game/chapters').loading, false);
});

test('respons POST memperbarui cache terkait tanpa intervensi halaman', async () => {
  const { api } = await import('../src/lib/api.js');
  let fetchCount = 0;
  globalThis.fetch = async (url, options) => {
    fetchCount += 1;
    if (options.method === 'POST') return respond({ attemptId: 'baru' }, 201);
    if (url === '/api/attempts') return respond({ attempts: [fetchCount] });
    return respond({});
  };
  const stop = subscribeResource('/attempts', () => {});
  await loadResource('/attempts');
  await api('/scenarios/12345678-1111-4111-8111-111111111111/attempts', {
    method: 'POST', body: {}, csrfToken: 'contoh',
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fetchCount, 3);
  assert.deepEqual(resourceSnapshot('/attempts').data.attempts, [3]);
  stop();
});

test('cache yang sudah kadaluarsa tetap bisa ditampilkan sambil menyegarkan data', async () => {
  globalThis.fetch = async () => respond({ chapters: ['awal'] });
  await loadResource('/game/chapters');
  const gate = deferred();
  globalThis.fetch = async () => gate.promise;
  const pending = loadResource('/game/chapters', { force: true });
  assert.deepEqual(resourceSnapshot('/game/chapters').data.chapters, ['awal']);
  assert.equal(resourceSnapshot('/game/chapters').loading, false);
  gate.resolve(respond({ chapters: ['baru'] }));
  await pending;
  assert.deepEqual(resourceSnapshot('/game/chapters').data.chapters, ['baru']);
});

test('pilihan dalam game langsung tersedia di halaman hasil tanpa GET detail tambahan', async () => {
  const { api } = await import('../src/lib/api.js');
  let attemptsGet = 0;
  const path = '/attempts/abc123';
  globalThis.fetch = async (url, options) => {
    if (url === `/api${path}`) { attemptsGet += 1; return respond({ attempt: { status: 'in_progress' } }); }
    if (options.method === 'POST') return respond({ attempt: { status: 'completed', finalScore: 100 } });
    return respond({});
  };
  const stop = subscribeResource(path, () => {});
  await loadResource(path);
  await api(`${path}/choices`, { method: 'POST', body: { choiceId: 'abc' }, csrfToken: 'contoh' });
  await loadResource(path);
  assert.equal(attemptsGet, 1);
  assert.equal(resourceSnapshot(path).data.attempt.finalScore, 100);
  stop();
});


test('kontrak avatar dan autentikasi frontend/backend tetap identik', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const name of ['avatar-options.js', 'auth-validation.js']) {
    const frontend = await readFile(new URL(`../shared/${name}`, import.meta.url), 'utf8');
    const backend = await readFile(new URL(`../../backend/shared/${name}`, import.meta.url), 'utf8');
    assert.equal(frontend, backend, `Kontrak ${name} berbeda`);
  }
});

test('equip memakai respons server langsung dan GET lama tidak menimpa item baru', async () => {
  const { api } = await import('../src/lib/api.js');
  const old = deferred();
  const updated = {balance:42,inventory:[{id:'frame-nyan'}],equipment:{frame:{item_id:'frame-nyan',name:'Nyan Circuit'}}};
  let getCount = 0;
  globalThis.fetch = async (url, options) => {
    if (options.method === 'PUT') return respond(updated);
    getCount++;
    return old.promise;
  };
  const stop = subscribeResource('/shop/me', () => {});
  const pending = loadResource('/shop/me');
  await api('/shop/equip', {method:'PUT', body:{slot:'frame',itemId:'frame-nyan'},csrfToken:'test'});
  assert.deepEqual(resourceSnapshot('/shop/me').data, updated);
  old.resolve(respond({balance:42,inventory:[],equipment:{}}));
  await pending;
  await loadResource('/shop/me');
  assert.equal(getCount,1);
  assert.deepEqual(resourceSnapshot('/shop/me').data.equipment,updated.equipment);
  stop();
});

test('lepas item dan pembelian langsung memperbarui inventaris dan saldo', async () => {
  const { api } = await import('../src/lib/api.js');
  let state = {balance:42,inventory:[{id:'title-signal'}],equipment:{title:{item_id:'title-signal'}}};
  globalThis.fetch = async () => respond(state);
  await loadResource('/shop/me');
  state = {...state,equipment:{}};
  await api('/shop/equip', {method:'PUT',body:{slot:'title',itemId:null},csrfToken:'test'});
  assert.deepEqual(resourceSnapshot('/shop/me').data.equipment,{});
  state = {...state,balance:12,inventory:[...state.inventory,{id:'sticker-shield'}]};
  await api('/shop/purchase', {method:'POST',body:{itemId:'sticker-shield'},csrfToken:'test'});
  assert.equal(resourceSnapshot('/shop/me').data.balance,12);
  assert.equal(resourceSnapshot('/shop/me').data.inventory.length,2);
});

test('respons pemakaian item akun lama tidak memasuki cache setelah logout', async () => {
  const { api } = await import('../src/lib/api.js');
  const old = deferred();
  globalThis.fetch = async () => old.promise;
  const pending = api('/shop/equip', {method:'PUT',body:{slot:'frame',itemId:'frame-nyan'},csrfToken:'old'});
  clearResourceCache();
  const newState = {balance:0,inventory:[],equipment:{}};
  globalThis.fetch = async () => respond(newState);
  await loadResource('/shop/me');
  old.resolve(respond({balance:42,inventory:[{id:'frame-nyan'}],equipment:{frame:{item_id:'frame-nyan'}}}));
  await pending;
  assert.deepEqual(resourceSnapshot('/shop/me').data,newState);
});
