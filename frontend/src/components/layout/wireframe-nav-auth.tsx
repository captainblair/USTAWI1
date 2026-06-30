"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { getClientSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type WireframeNavAuthProps = {
  scrolled: boolean;
};

export function WireframeNavAuth({ scrolled }: WireframeNavAuthProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, signOut } = useAuth();

  const linkClass = cn(
    "text-[15px] font-medium transition",
    scrolled ? "text-[#0a1128]/75 hover:text-[#0a1128]" : "text-white/85 hover:text-white",
  );

  if (isLoading) {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-white/20" />;
  }

  if (!isAuthenticated || !user) {
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
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Link href="/saved" className={linkClass}>
        Saved
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
