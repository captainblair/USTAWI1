"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { getClientSession } from "@/lib/auth/session";

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-ustawi-sand" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Link
          href="/login"
          className="hidden text-[15px] font-medium text-ustawi-navy/75 sm:block hover:text-ustawi-navy"
        >
          Login
        </Link>
        <Link href="/register">
          <Button size="sm" className="min-w-[110px] px-5">
            Register
          </Button>
        </Link>
      </>
    );
  }

  const initials =
    user.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? user.email[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    const session = getClientSession();
    if (session?.accessToken && session.refreshToken) {
      try {
        await logout(session.refreshToken, session.accessToken);
      } catch {
        // Still clear local session if API fails.
      }
    }
    signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="hidden items-center gap-2 sm:flex">
        <ProfileAvatar
          src={user.avatar}
          version={user.avatar_updated_at}
          initials={initials}
          size="sm"
          className="ring-0 shadow-none"
        />
        <div className="text-left leading-tight">
          <p className="max-w-[140px] truncate text-sm font-semibold text-ustawi-navy">
            {user.full_name ?? user.email}
          </p>
          <p className="text-xs capitalize text-ustawi-muted">{user.role.toLowerCase()}</p>
        </div>
      </Link>
      {user.role === "TENANT" && (
        <>
          <Link
            href="/applications"
            className="hidden rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream sm:inline-flex"
          >
            Applications
          </Link>
          <Link
            href="/saved"
            className="hidden rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream sm:inline-flex"
          >
            Saved
          </Link>
        </>
      )}
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="hidden rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream sm:inline-flex"
        >
          Admin
        </Link>
      )}
      <Link
        href="/profile"
        className="hidden rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream sm:inline-flex"
      >
        Profile
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ustawi-border text-ustawi-muted transition hover:border-ustawi-red/30 hover:text-ustawi-red"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
