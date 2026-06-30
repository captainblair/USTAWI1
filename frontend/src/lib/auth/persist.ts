import type { AuthPayload } from "@/types/auth";
import type { AuthSession } from "@/lib/auth/constants";
import { mapUserFromApi } from "@/lib/auth/map-user";
import { setClientSession } from "@/lib/auth/session";

export function persistAuthPayload(payload: AuthPayload): AuthSession {
  const session: AuthSession = {
    accessToken: payload.tokens.access,
    refreshToken: payload.tokens.refresh,
    user: mapUserFromApi(payload.user),
  };
  setClientSession(session);
  return session;
}
