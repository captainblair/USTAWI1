"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { getClientSession } from "@/lib/auth/session";
import { getAccountNavLinks } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type WireframeNavAuthProps = {
  scrolled: boolean;
  layout?: "inline" | "menu";
  onNavigate?: () => void;
};

export function WireframeNavAuth({ scrolled, layout = "inline", onNavigate }: WireframeNavAuthProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, signOut } = useAuth();

  const linkClass = cn(
    layout === "menu"
      ? "block py-2.5 text-sm font-medium"
      : "text-[15px] font-medium transition",
    layout === "menu"
      ? scrolled
        ? "text-[#0a1128]/80 hover:text-[#0a1128]"
        : "text-white/90 hover:text-white"
      : scrolled
        ? "text-[#0a1128]/75 hover:text-[#0a1128]"
        : "text-white/85 hover:text-white",
  );

  if (isLoading) {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-white/20" />;
  }

  if (!isAuthenticated || !user) {
    if (layout === "menu") {
      return (
        <div className={cn("mt-2 space-y-2 border-t pt-3", scrolled ? "border-ustawi-border" : "border-white/10")}>
          <Link href="/login" className={linkClass} onClick={onNavigate}>
            Login
          </Link>
          <Link href="/register" onClick={onNavigate}>
            <Button size="sm" className="w-full min-w-0 shadow-ustawi-red">
              Register
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <>
        <Link href="/login" className={linkClass}>
          Login
        </Link>
        <Link href="/register">
          <Button size="sm" className="min-w-[120px] px-6 shadow-ustawi-red">
            Register
          </Button>
        </Link>
      </>
    );
  }

  async function handleSignOut() {
    const session = getClientSession();
    if (session?.accessToken && session.refreshToken) {
      try {
        await logout(session.refreshToken, session.accessToken);
      } catch {
        /* ignore */
      }
    }
    signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  const accountLinks = getAccountNavLinks(user.role);

  if (layout === "menu") {
    return (
      <div className={cn("mt-2 border-t pt-2", scrolled ? "border-ustawi-border" : "border-white/10")}>
        <p
          className={cn(
            "py-2 text-xs font-semibold uppercase tracking-wide",
            scrolled ? "text-[#0a1128]/50" : "text-white/50",
          )}
        >
          Account
        </p>
        {accountLinks.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass} onClick={onNavigate}>
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(linkClass, "w-full text-left")}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      {accountLinks.slice(0, 2).map((link) => (
        <Link key={link.href} href={link.href} className={linkClass}>
          {link.label}
        </Link>
      ))}
      <Link href="/profile" className={linkClass}>
        Profile
      </Link>
      <span className={cn("hidden text-sm font-semibold sm:inline", scrolled ? "text-[#0a1128]" : "text-white")}>
        {user.full_name?.split(" ")[0] ?? user.email.split("@")[0]}
      </span>
      <Button
        size="sm"
        variant="outline"
        className={cn(
          "min-w-[100px]",
          scrolled
            ? "border-ustawi-border text-ustawi-navy hover:bg-ustawi-cream"
            : "border-white/30 bg-white/10 text-white hover:bg-white/20",
        )}
        onClick={handleSignOut}
      >
        Sign out
      </Button>
    </>
  );
}
