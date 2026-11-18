import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import ApiClient from '../api/ApiClient.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await ApiClient.get('/auth/me');
      const access = await ApiClient.get('/permissions/me');
      setUser(data.user);
      setPermissions(access.permissions);
      setStatus('authenticated');
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        setPermissions({});
        setStatus('anonymous');
      } else {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const data = await ApiClient.post('/auth/login', credentials);
    const access = await ApiClient.get('/permissions/me');
    setUser(data.user);
    setPermissions(access.permissions);
    setStatus('authenticated');
    return data.user;
  }, []);

  const register = useCallback(async (details) => ApiClient.post('/auth/register', details), []);

  const logout = useCallback(async () => {
    await ApiClient.post('/auth/logout', {});
    setUser(null);
    setPermissions({});
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ user, permissions, status, login, register, logout, refresh }),
    [user, permissions, status, login, register, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}