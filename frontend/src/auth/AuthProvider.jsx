import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, loadSession } from '../lib/api.js';
import { clearResourceCache } from '../lib/resource-cache.js';
import { AuthContext } from './AuthContext.js';

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, csrfToken: null, loading: true, error: '' });
  const identity = useRef(null);
  const refreshSession = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await loadSession();
      if (identity.current && identity.current !== data.user?.id) clearResourceCache();
      identity.current = data.user?.id ?? null;
      setState({ ...data, loading: false, error: '' });
      return data.user;
    } catch (error) {
      clearResourceCache();
      identity.current = null;
      setState({ user: null, csrfToken: null, loading: false, error: error.message });
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadSession().then((data) => {
      if (active) {
        if (identity.current && identity.current !== data.user?.id) clearResourceCache();
        identity.current = data.user?.id ?? null;
        setState({ ...data, loading: false, error: '' });
      }
    }).catch((error) => {
      if (active) {
        clearResourceCache();
        identity.current = null;
        setState({ user: null, csrfToken: null, loading: false, error: error.message });
      }
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (values) => {
    const data = await api('/auth/login', { method: 'POST', body: values, csrfToken: state.csrfToken });
    clearResourceCache();
    identity.current = data.user?.id ?? null;
    setState({ ...data, loading: false, error: '' });
    return data.user;
  }, [state.csrfToken]);
  const register = useCallback((values) => api('/auth/register', { method: 'POST', body: values, csrfToken: state.csrfToken }), [state.csrfToken]);
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST', body: {}, csrfToken: state.csrfToken });
    clearResourceCache();
    identity.current = null;
    setState({ user: null, csrfToken: null, loading: true, error: '' });
    await refreshSession();
  }, [state.csrfToken, refreshSession]);
  const value = useMemo(() => ({ ...state, login, register, logout, refreshSession }), [state, login, register, logout, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
