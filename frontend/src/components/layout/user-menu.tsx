"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { getClientSession } from "@/lib/auth/session";
import { APP_NAV_LINKS, getAccountNavLinks } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-ustawi-sand" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-[15px] font-medium text-ustawi-navy/75 hover:text-ustawi-navy"
          >
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="min-w-[110px] px-5">
              Register
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ustawi-navy hover:bg-ustawi-cream"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <MobileMenuPanel onClose={() => setMenuOpen(false)}>
            <Link
              href="/login"
              className="block py-2.5 text-sm font-medium text-ustawi-navy"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="mt-2 w-full">
                Register
              </Button>
            </Link>
          </MobileMenuPanel>
        )}
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

  const accountLinks = getAccountNavLinks(user.role);

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
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile — bell + hamburger only */}
      <div className="flex items-center gap-1 lg:hidden">
        <NotificationBell variant="light" className="h-9 w-9" />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ustawi-navy hover:bg-ustawi-cream"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <MobileMenuPanel onClose={() => setMenuOpen(false)}>
          <div className="mb-3 flex items-center gap-3 border-b border-ustawi-border pb-3">
            <ProfileAvatar
              src={user.avatar}
              version={user.avatar_updated_at}
              initials={initials}
              size="sm"
              className="ring-0 shadow-none"
            />
            <div>
              <p className="text-sm font-semibold text-ustawi-navy">{user.full_name ?? user.email}</p>
              <p className="text-xs capitalize text-ustawi-muted">{user.role.toLowerCase()}</p>
            </div>
          </div>

          <p className="py-1 text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Explore</p>
          {APP_NAV_LINKS.filter((l) => l.matchPath).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-2.5 text-sm font-medium text-ustawi-navy/80",
                isActive(link.matchPath!) && "font-semibold text-ustawi-navy",
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <p className="mt-3 border-t border-ustawi-border pt-3 text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
            Account
          </p>
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-2.5 text-sm font-medium text-ustawi-navy/80",
                isActive(link.href) && "font-semibold text-ustawi-navy",
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center gap-2 py-2.5 text-sm font-medium text-ustawi-red"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </MobileMenuPanel>
      )}

      {/* Desktop */}
      <div className="hidden items-center gap-3 lg:flex">
        <NotificationBell variant="light" className="h-9 w-9" />
        <Link href="/profile" className="flex items-center gap-2">
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
        {(user.role === "LANDLORD" || user.role === "AGENT") && (
          <>
            <Link
              href="/landlord"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Dashboard
            </Link>
            <Link
              href="/landlord/properties"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Properties
            </Link>
          </>
        )}
        {user.role === "TENANT" && (
          <>
            <Link
              href="/applications"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Applications
            </Link>
            <Link
              href="/leases"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Leases
            </Link>
            <Link
              href="/maintenance"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Maintenance
            </Link>
            <Link
              href="/saved"
              className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
            >
              Saved
            </Link>
          </>
        )}
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
          >
            Admin
          </Link>
        )}
        <Link
          href="/profile"
          className="rounded-full border border-ustawi-border px-3 py-1.5 text-xs font-semibold text-ustawi-navy hover:bg-ustawi-cream"
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
    </>
  );
}

function MobileMenuPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full z-50 mt-0 w-full border-b border-ustawi-border bg-white px-4 py-4 shadow-lg lg:hidden">
        {children}
      </div>
    </>
  );
}
