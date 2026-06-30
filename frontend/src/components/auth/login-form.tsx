"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  AuthDivider,
  AuthFieldLabel,
  AuthFooterLink,
  AuthGoogleButton,
  AuthPageHeader,
  AuthPrimaryButton,
  PremiumAuthSplitLayout,
  authInputClass,
} from "@/components/auth/premium-auth-split-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { loginWithEmail } from "@/lib/api/auth";
import { persistAuthPayload } from "@/lib/auth/persist";
import { getPostAuthRedirect } from "@/lib/auth/map-user";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

type LoginPortal = "TENANT" | "LANDLORD";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const [portal, setPortal] = useState<LoginPortal>("TENANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = await loginWithEmail(email.trim(), password);
      const session = persistAuthPayload(payload);
      setSession(session);

      const next = getPostAuthRedirect(
        session.user.role,
        searchParams.get("next") ?? (portal === "TENANT" ? "/saved" : "/properties"),
      );
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumAuthSplitLayout brandVariant="login" maxFormWidth="md">
      <AuthPageHeader title="Welcome back!" subtitle="Please enter your details." />

      <AuthGoogleButton />
      <AuthDivider label="Manual sign in" />

      <div className="mb-5 inline-flex rounded-lg border border-[#E8EAF2] bg-[#F4F6F8] p-0.5">
        {(["TENANT", "LANDLORD"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPortal(p)}
            className={cn(
              "rounded-md px-4 py-2 text-[13px] font-medium transition",
              portal === p ? "bg-white text-ustawi-navy shadow-sm" : "text-ustawi-muted hover:text-ustawi-navy",
            )}
          >
            {p === "TENANT" ? "Tenant" : "Landlord"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4">
        <div>
          <AuthFieldLabel htmlFor="login-email">Email</AuthFieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <AuthFieldLabel htmlFor="login-password">Password</AuthFieldLabel>
            <Link href="/login" className="text-xs font-medium text-ustawi-red hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(authInputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ustawi-muted hover:text-ustawi-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <AuthPrimaryButton disabled={loading}>{loading ? "Signing in…" : "Sign in"}</AuthPrimaryButton>
      </form>

      <AuthFooterLink prompt="Don't have an account?" linkText="Sign up" href="/register" />
    </PremiumAuthSplitLayout>
  );
}
