import { cookies } from "next/headers";
import { AUTH_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

/** Server-side token for authenticated API calls (SSR / RSC). */
export async function getServerAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
}
