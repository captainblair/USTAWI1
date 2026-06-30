import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth/constants";

function parseUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Read session from localStorage (client only). Used until Phase F1 auth UI ships. */
export function getClientSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
  const user = parseUser(localStorage.getItem(AUTH_USER_KEY));
  if (!accessToken || !user) return null;

  return {
    accessToken,
    refreshToken: localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) ?? undefined,
    user,
  };
}

export function setClientSession(session: AuthSession): void {
  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, session.refreshToken);
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  setAccessTokenCookie(session.accessToken);
}

export function setAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAccessTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearClientSession(): void {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearAccessTokenCookie();
}

export function getClientAccessToken(): string | null {
  return getClientSession()?.accessToken ?? null;
}
