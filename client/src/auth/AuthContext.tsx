import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getStoredUser,
  getToken,
  normalizeStoredUser,
  saveSession,
  type AuthUser,
} from "./session";
import { apiPath } from "../api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function authFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiPath(url), { ...init, headers });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await authFetch<{ user: AuthUser }>("/api/auth/me");
      const user = normalizeStoredUser(res.user);
      saveSession(token, user);
      setUser(user);
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authFetch<{ user: AuthUser; token: string }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    const user = normalizeStoredUser(res.user);
    saveSession(res.token, user);
    setUser(user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await authFetch<{ user: AuthUser; token: string }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        },
      );
      const user = normalizeStoredUser(res.user);
      saveSession(res.token, user);
      setUser(user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
