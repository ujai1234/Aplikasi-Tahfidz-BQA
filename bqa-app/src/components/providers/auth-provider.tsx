"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api, clearToken, getToken, type PublicUser } from "@/lib/api";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  isAdmin: boolean;
  isKepsek: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<PublicUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Periodic 5-minute session timer check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!getToken()) {
        logout();
        toast.error("Sesi 5 menit Anda telah berakhir. Silakan login kembali.");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, logout]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const res = await api.auth.login(usernameOrEmail, password);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "Admin",
      isKepsek: user?.role === "Kepsek",
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
