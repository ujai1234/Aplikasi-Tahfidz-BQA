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
import { useSession, signOut as betterSignOut } from "@/lib/auth-client";

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
  const [legacyUser, setLegacyUser] = useState<PublicUser | null>(null);
  const [legacyLoading, setLegacyLoading] = useState(true);
  
  // Better Auth session hook
  const { data: session, isPending: sessionPending } = useSession();

  const logout = useCallback(async () => {
    clearToken();
    setLegacyUser(null);
    try {
      await betterSignOut();
    } catch(e) {}
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  useEffect(() => {
    // If we already have a JWT token (from manual login or previous google login), use it
    if (getToken()) {
      api.auth
        .me()
        .then((res) => setLegacyUser(res.user))
        .catch(() => {
          clearToken();
          setLegacyUser(null);
        })
        .finally(() => setLegacyLoading(false));
      return;
    }

    // If no JWT token but there's a better-auth Google session,
    // exchange it for a JWT token via the dedicated endpoint.
    if (session?.user && !sessionPending) {
      api.auth
        .googleToken()
        .then((res) => {
          setLegacyUser(res.user);
          setLegacyLoading(false);
        })
        .catch((err) => {
          // Email not registered in Tahfidz system — show a helpful message
          const msg = err?.message || "Email Google Anda belum terdaftar di sistem";
          toast.error(msg);
          setLegacyUser(null);
          setLegacyLoading(false);
          // Sign out of better-auth so user can try again
          betterSignOut().catch(() => {});
        });
      return;
    }

    // No token and no Google session = not logged in
    if (!sessionPending) {
      setLegacyLoading(false);
    }
  }, [session?.user, sessionPending]);

  // Periodic session check only if using legacy token (not Better Auth)
  useEffect(() => {
    if (!legacyUser || session?.user) return;

    const interval = setInterval(() => {
      if (!getToken()) {
        logout();
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [legacyUser, session?.user, logout]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const res = await api.auth.login(usernameOrEmail, password);
      setLegacyUser(res.user);
      return res.user;
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: legacyUser,
      loading: legacyLoading || sessionPending,
      isAdmin: legacyUser?.role === "Admin",
      isKepsek: legacyUser?.role === "Kepsek",
      login,
      logout,
    }),
    [legacyUser, legacyLoading, sessionPending, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
