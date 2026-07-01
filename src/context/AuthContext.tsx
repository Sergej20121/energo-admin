import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import type { CurrentUser } from '../types';

type AuthContextValue = {
  token: string | null;
  user: CurrentUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_access_token'));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    if (!localStorage.getItem('admin_access_token')) {
      setUser(null);
      return;
    }

    const me = await apiRequest<CurrentUser>('/users/me');
    if (me.role !== 'ADMIN') {
      throw new Error('У вас нет прав администратора');
    }
    setUser(me);
  }

  async function login(phone: string, password: string) {
    const response = await apiRequest<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    localStorage.setItem('admin_access_token', response.accessToken);
    setToken(response.accessToken);
    await refreshUser();
  }

  function logout() {
    localStorage.removeItem('admin_access_token');
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    const run = async () => {
      try {
        if (token) {
          await refreshUser();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({ token, user, loading, login, logout, refreshUser }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
