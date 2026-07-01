"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

type GoogleSignInButtonProps = {
  clientId: string;
  onSuccess: (credential: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

const buttonClassName =
  "flex h-11 w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-lg border border-[#E8EAF2] bg-white text-sm font-medium text-ustawi-navy transition hover:bg-[#FAFBFC]";

export function GoogleSignInButton({
  clientId,
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      const width = Math.min(Math.max(node.offsetWidth, 200), 400);
      setButtonWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <GoogleMark />
        Google
        <span className="font-normal text-ustawi-muted">(not configured)</span>
      </button>
    );
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <GoogleMark />
        Google
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0 max-w-full">
      <div className={`${buttonClassName} pointer-events-none`} aria-hidden>
        <GoogleMark />
        Google
      </div>
      <div className="absolute inset-0 overflow-hidden opacity-[0.01] [&>div]:!h-full [&>div]:!w-full [&>div>div]:!h-full [&>div>div]:!w-full">
        <GoogleLogin
          theme="outline"
          size="large"
          shape="rectangular"
          text="signin_with"
          width={String(buttonWidth)}
          onSuccess={(response: CredentialResponse) => {
            if (!response.credential) {
              onError?.("Google did not return a sign-in token.");
              return;
            }
            onSuccess(response.credential);
          }}
          onError={() => onError?.("Google sign-in was cancelled or failed.")}
          useOneTap={false}
        />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
