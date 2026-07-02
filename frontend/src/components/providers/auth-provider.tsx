"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser } from "@/lib/api/auth";
import {
  canSaveProperties,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth/constants";
import { mapUserFromApi } from "@/lib/auth/map-user";
import { clearClientSession, getClientSession, setClientSession } from "@/lib/auth/session";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  canSave: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      const stored = getClientSession();
      if (!stored?.accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const apiUser = await fetchCurrentUser(stored.accessToken);
        const refreshed: AuthSession = {
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          user: mapUserFromApi(apiUser),
        };
        setClientSession(refreshed);
        setSessionState(refreshed);
      } catch {
        clearClientSession();
        setSessionState(null);
      } finally {
        setIsLoading(false);
      }
    }

    hydrate();
  }, []);

  // Keep last_seen_at fresh while the user has the app open (updates via authenticated API calls).
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    function pingPresence() {
      if (document.visibilityState !== "visible") return;
      fetchCurrentUser(token).catch(() => {});
    }

    pingPresence();
    const interval = window.setInterval(pingPresence, 5 * 60 * 1000);
    const onVisible = () => pingPresence();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.accessToken]);

  const setSession = useCallback((next: AuthSession) => {
    setClientSession(next);
    setSessionState(next);
  }, []);

  const signOut = useCallback(() => {
    clearClientSession();
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      canSave: canSaveProperties(session?.user),
      isLoading,
      setSession,
      signOut,
    }),
    [session, isLoading, setSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
