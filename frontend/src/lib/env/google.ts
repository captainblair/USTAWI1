/** Google OAuth client ID from Vercel/local env (NEXT_PUBLIC_GOOGLE_CLIENT_ID). */
export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
}
