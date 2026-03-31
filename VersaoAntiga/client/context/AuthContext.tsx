import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User } from "@shared/api";

type AuthValue = {
  user: User | null;
  token: string | null;
  initialized: boolean;
  setSession: (user: User, token: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User; token?: string }>;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setInitialized(true);
      return;
    }
    setToken(t);
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.user) setUser(data.user as User);
      })
      .finally(() => setInitialized(true));
  }, []);

  const setSession = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("token", t);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data?.success && data?.token && data?.user) {
      setSession(data.user as User, data.token as string);
      return { success: true, user: data.user as User, token: data.token as string };
    }
    return { success: false, message: (data?.message as string) || "Falha no login" };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const authFetch = (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const value = useMemo(
    () => ({ user, token, initialized, setSession, login, logout, authFetch }),
    [user, token, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

