"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToggleSaveProperty } from "@/hooks/use-saved-properties";
import { cn } from "@/lib/utils";

type SavePropertyButtonProps = {
  propertyId: string;
  /** From property detail API when authenticated. */
  initialSaved?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function SavePropertyButton({
  propertyId,
  initialSaved = false,
  className,
  size = "md",
}: SavePropertyButtonProps) {
  const { isLoading: authLoading } = useAuth();
  const { isSaved, toggle, isPending, isAuthenticated, canSave } = useToggleSaveProperty(
    propertyId,
    initialSaved,
  );

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (authLoading) return;

    if (!isAuthenticated || !canSave) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    toggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || authLoading}
      aria-label={isSaved ? "Remove from saved properties" : "Save property"}
      aria-pressed={isSaved}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/95 text-ustawi-navy shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white disabled:opacity-60",
        buttonSize,
        isSaved && "text-ustawi-red ring-ustawi-red/20",
        className,
      )}
    >
      <Heart className={cn(iconSize, isSaved && "fill-current")} />
    </button>
  );
}

/** Compact link shown on the saved-properties page when logged out. */
export function SavedPropertiesGuestPrompt() {
  return (
    <div className="rounded-2xl border border-ustawi-border bg-white p-10 text-center shadow-sm">
      <Heart className="mx-auto h-10 w-10 text-ustawi-red" />
      <h2 className="mt-4 text-xl font-bold text-ustawi-navy">Sign in to view saved homes</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ustawi-muted">
        Saved properties are available for tenant accounts. Log in to bookmark listings and compare
        them later.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login?next=/saved"
          className="rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white shadow-ustawi-red"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-ustawi-border px-6 py-2.5 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

/** Shown when logged in but role cannot save properties (landlord, admin, agent, etc.). */
export function SavedPropertiesRoleNotice({ role }: { role: string }) {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <div className="rounded-2xl border border-ustawi-border bg-white p-10 text-center shadow-sm">
      <Heart className="mx-auto h-10 w-10 text-ustawi-muted/50" />
      <h2 className="mt-4 text-xl font-bold text-ustawi-navy">Saved homes are for tenants</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ustawi-muted">
        You&apos;re signed in as a <strong className="text-ustawi-navy">{roleLabel}</strong>. Bookmarking
        listings is available on tenant accounts. Browse properties or manage your account below.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/properties"
          className="rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white shadow-ustawi-red"
        >
          Browse properties
        </Link>
        <Link
          href="/profile"
          className="rounded-full border border-ustawi-border px-6 py-2.5 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
        >
          Your profile
        </Link>
      </div>
    </div>
  );
}

/** @deprecated Use SavedPropertiesGuestPrompt or SavedPropertiesRoleNotice */
export function SavedPropertiesLoginPrompt() {
  return <SavedPropertiesGuestPrompt />;
}
