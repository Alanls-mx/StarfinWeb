import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, type UserProfile } from './api';

type AuthState =
  | { status: 'loading'; token: string | null; user: UserProfile | null }
  | { status: 'anonymous'; token: null; user: null }
  | { status: 'authenticated'; token: string; user: UserProfile };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const TOKEN_STORAGE_KEY = 'starfinplugins_token';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return { status: 'loading', token, user: null };
  });

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setState({ status: 'anonymous', token: null, user: null });
      return;
    }

    try {
      const user = await getMe(token);
      setState({ status: 'authenticated', token, user });
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setState({ status: 'anonymous', token: null, user: null });
    }
  }, []);

  useEffect(() => {
    if (state.status === 'loading') {
      void refresh();
    }
  }, [state.status, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ status: 'loading', token: prev.status === 'authenticated' ? prev.token : null, user: null }));
    const { token, user } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setState({ status: 'authenticated', token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({ status: 'anonymous', token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ state, login, logout, refresh }), [state, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
