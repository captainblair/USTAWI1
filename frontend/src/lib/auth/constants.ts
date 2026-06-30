export const AUTH_ACCESS_TOKEN_KEY = "ustawi_access_token";
export const AUTH_REFRESH_TOKEN_KEY = "ustawi_refresh_token";
export const AUTH_USER_KEY = "ustawi_user";

/** Cookie name mirrored for SSR once login (Phase F1) sets httpOnly cookies. */
export const AUTH_ACCESS_TOKEN_COOKIE = "ustawi_access_token";

export type UserRole = "TENANT" | "LANDLORD" | "AGENT" | "INSPECTOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  full_name?: string;
  avatar?: string | null;
  avatar_updated_at?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

/** Tenants can save properties per backend `IsAuthenticatedTenantOrReadOnly`. */
export function canSaveProperties(user: AuthUser | null | undefined): boolean {
  return user?.role === "TENANT";
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function isTenant(user: AuthUser | null | undefined): boolean {
  return user?.role === "TENANT";
}
