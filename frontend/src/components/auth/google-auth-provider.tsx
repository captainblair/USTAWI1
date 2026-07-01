"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

type GoogleAuthProviderProps = {
  clientId: string;
  children: React.ReactNode;
};

export function GoogleAuthProvider({ clientId, children }: GoogleAuthProviderProps) {
  if (!clientId) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
