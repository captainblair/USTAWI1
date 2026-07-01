"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/payments", label: "Billing" },
  { href: "/profile", label: "Settings" },
];

export function PaymentSuccessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-[#F3F4F8]">
      <header className="border-b border-[#E8EAF2] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-xl font-bold tracking-[0.08em] text-ustawi-navy">
            USTAWI
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => {
              const onSuccessPage = pathname.startsWith("/payments/success");
              const active =
                item.href === "/dashboard"
                  ? onSuccessPage || pathname === item.href || pathname.startsWith(`${item.href}/`)
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium text-ustawi-navy transition hover:text-ustawi-navy/80",
                    active && "underline decoration-2 underline-offset-8",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/properties"
              className="rounded-full p-2 text-ustawi-navy hover:bg-ustawi-cream"
              aria-label="Search properties"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/profile">
              <ProfileAvatar
                src={user?.avatar}
                version={user?.avatar_updated_at}
                initials={initials}
                size="sm"
                className="ring-0 shadow-none"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">{children}</main>
    </div>
  );
}
