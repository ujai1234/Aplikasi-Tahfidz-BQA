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
    // If we have a valid Better Auth session, fetch the backend to resolve the Tahfidz user
    // because Better Auth 'session.user' only contains Google profile data.
    if (session?.user) {
       api.auth.me()
         .then((res) => {
            setLegacyUser(res.user);
            setLegacyLoading(false);
         })
         .catch(() => {
            setLegacyUser(null);
            setLegacyLoading(false);
         });
       return;
    }
    
    // Fallback to legacy JWT logic
    if (!getToken()) {
      setLegacyLoading(false);
      return;
    }
    api.auth
      .me()
      .then((res) => setLegacyUser(res.user))
      .catch(() => {
        clearToken();
        setLegacyUser(null);
      })
      .finally(() => setLegacyLoading(false));
  }, [session?.user]);

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
