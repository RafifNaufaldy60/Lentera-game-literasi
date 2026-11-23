import { api } from './api.js';

const resources = new Map();
const INITIAL = Object.freeze({ data: null, loading: true, error: '' });
const DEFAULT_TTL = 45_000;
const MAX_RESOURCES = 100;
let generation = 0;

function ttl(path) {
  if (path === '/catalog' || path === '/scenarios' || path.startsWith('/materials/')) return 180_000;
  if (path.startsWith('/attempts/')) return 10_000;
  if (path.startsWith('/admin/')) return 20_000;
  return DEFAULT_TTL;
}

function entryFor(path) {
  let entry = resources.get(path);
  if (!entry) {
    entry = { snapshot: INITIAL, updatedAt: 0, promise: null, listeners: new Set(), revision: 0, refreshAfterCurrent: false };
    resources.set(path, entry);
    if (resources.size > MAX_RESOURCES) {
      for (const [key, candidate] of resources) {
        if (resources.size <= MAX_RESOURCES) break;
        if (!candidate.listeners.size && !candidate.promise) resources.delete(key);
      }
    }
  }
  return entry;
}

function publish(entry, snapshot) {
  entry.snapshot = snapshot;
  for (const listener of entry.listeners) listener();
}

export function resourceSnapshot(path) {
  return resources.get(path)?.snapshot ?? INITIAL;
}

export function subscribeResource(path, listener) {
  const entry = entryFor(path);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

export function loadResource(path, { force = false } = {}) {
  if (!path) return Promise.resolve(null);
  const entry = entryFor(path);
  if (entry.promise) return entry.promise;
  if (!force && entry.snapshot.data !== null && Date.now() - entry.updatedAt < ttl(path)) {
    return Promise.resolve(entry.snapshot.data);
  }
  if (entry.snapshot.data === null) publish(entry, { data: null, loading: true, error: '' });
  const requestGeneration = generation;
  const requestRevision = entry.revision;
  const pending = api(path).then((data) => {
    if (requestGeneration === generation && requestRevision === entry.revision && resources.get(path) === entry) {
      entry.updatedAt = Date.now();
      publish(entry, { data, loading: false, error: '' });
    }
    return data;
  }).catch((error) => {
    if (requestGeneration === generation && requestRevision === entry.revision && resources.get(path) === entry) {
      const previous = entry.snapshot.data;
      publish(entry, { data: previous, loading: false, error: previous === null ? error.message : '' });
    }
    throw error;
  }).finally(() => {
    if (entry.promise === pending) entry.promise = null;
    if (entry.refreshAfterCurrent && requestGeneration === generation && resources.get(path) === entry) {
      entry.refreshAfterCurrent = false;
      if (entry.listeners.size) loadResource(path, { force: true }).catch(() => {});
    }
  });
  entry.promise = pending;
  return pending;
}

export function prefetchResource(path) {
  return loadResource(path).catch(() => null);
}

export function refreshResource(path) {
  return loadResource(path, { force: true });
}

export function primeResource(path, data) {
  const entry = entryFor(path);
  entry.revision += 1;
  entry.updatedAt = Date.now();
  publish(entry, { data, loading: false, error: '' });
}

export function invalidateResources(prefixes, { skip = null } = {}) {
  for (const [path, entry] of resources) {
    if (path === skip) continue;
    if (!prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))) continue;
    entry.updatedAt = 0;
    entry.revision += 1;
    if (entry.promise) {
      entry.refreshAfterCurrent = true;
    } else if (entry.listeners.size) {
      loadResource(path, { force: true }).catch(() => {});
    }
  }
}

export function invalidateAfterMutation(path, response = null) {
  if (path.startsWith('/shop/')) {
    invalidateResources(['/shop/me', '/shop/catalog', '/shop/history', '/game/profile']);
  } else if (path.startsWith('/admin/shop/')) {
    invalidateResources(['/shop/catalog', '/shop/me', '/admin/shop/items', '/admin/shop/transactions']);
  } else if (path === '/game/profile') {
    invalidateResources(['/game/profile']);
  } else if (path.startsWith('/attempts/') || /^\/scenarios\/[^/]+\/attempts$/.test(path)) {
    const decision = path.match(/^(\/attempts\/[^/]+)\/choices$/);
    const playedPath = decision && response?.attempt ? decision[1] : null;
    if (playedPath) primeResource(playedPath, { attempt: response.attempt });
    invalidateResources(['/attempts', '/leaderboard', '/game/profile', '/game/chapters', '/shop/me', '/shop/history', '/admin/shop/transactions', '/admin/overview', '/admin/attempts'], { skip: playedPath });
  } else if (path.startsWith('/admin/materials') || path.startsWith('/admin/scenarios')) {
    invalidateResources(['/catalog', '/materials', '/scenarios', '/game/chapters', '/admin/overview', '/admin/materials', '/admin/scenarios']);
  }
}

export function clearResourceCache() {
  generation += 1;
  for (const entry of resources.values()) {
    entry.updatedAt = 0;
    publish(entry, INITIAL);
  }
  resources.clear();
}
