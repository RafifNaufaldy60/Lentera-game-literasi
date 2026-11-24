import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { loadResource, refreshResource, resourceSnapshot, subscribeResource } from '../lib/resource-cache.js';

export function useResource(path) {
  const subscribe = useCallback((notify) => subscribeResource(path, notify), [path]);
  const getSnapshot = useCallback(() => resourceSnapshot(path), [path]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const reload = useCallback(() => refreshResource(path).catch(() => {}), [path]);

  useEffect(() => { loadResource(path).catch(() => {}); }, [path]);
  return { ...state, reload };
}
