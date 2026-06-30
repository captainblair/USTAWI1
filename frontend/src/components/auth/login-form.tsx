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
import type { UserRole } from "@/lib/auth/constants";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

type LoginPortal = "TENANT" | "LANDLORD" | "AGENT" | "ADMIN";

const PORTALS: { value: LoginPortal; label: string }[] = [
  { value: "TENANT", label: "Tenant" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "AGENT", label: "Agent" },
  { value: "ADMIN", label: "Admin" },
];

const PORTAL_DEFAULT_ROLES: Record<LoginPortal, UserRole> = {
  TENANT: "TENANT",
  LANDLORD: "LANDLORD",
  AGENT: "AGENT",
  ADMIN: "ADMIN",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const initialPortal = (searchParams.get("portal")?.toUpperCase() as LoginPortal | null) ?? "TENANT";
  const [portal, setPortal] = useState<LoginPortal>(
    PORTALS.some((p) => p.value === initialPortal) ? initialPortal : "TENANT",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRoleNotice(null);
    setLoading(true);

    try {
      const payload = await loginWithEmail(email.trim(), password);
      const session = persistAuthPayload(payload);
      setSession(session);

      const expectedRole = PORTAL_DEFAULT_ROLES[portal];
      if (session.user.role !== expectedRole) {
        setRoleNotice(
          `Signed in as ${session.user.role.toLowerCase()}. Redirecting to your ${session.user.role.toLowerCase()} area.`,
        );
      }

      const next = getPostAuthRedirect(session.user.role, searchParams.get("next"));
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

      <div className="mb-5 inline-flex flex-wrap rounded-lg border border-[#E8EAF2] bg-[#F4F6F8] p-0.5">
        {PORTALS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPortal(value)}
            className={cn(
              "rounded-md px-3 py-2 text-[13px] font-medium transition sm:px-4",
              portal === value ? "bg-white text-ustawi-navy shadow-sm" : "text-ustawi-muted hover:text-ustawi-navy",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {portal === "ADMIN" && (
        <p className="mb-4 rounded-lg border border-ustawi-navy/10 bg-ustawi-cream px-4 py-3 text-xs text-ustawi-muted">
          Admin accounts are provisioned by the platform team (not self-registration). Sign in with your admin email
          and password.
        </p>
      )}

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
        {roleNotice && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {roleNotice}
          </p>
        )}

        <AuthPrimaryButton disabled={loading}>{loading ? "Signing in…" : "Sign in"}</AuthPrimaryButton>
      </form>

      <AuthFooterLink prompt="Don't have an account?" linkText="Sign up" href="/register" />
    </PremiumAuthSplitLayout>
  );
}
