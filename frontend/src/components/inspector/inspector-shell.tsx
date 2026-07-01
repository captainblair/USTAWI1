"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, Menu, MessageSquareWarning, Search, X } from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/inspector", label: "Verification queue", icon: ClipboardList, exact: true },
  { href: "/inspector/community-reports", label: "Community reports", icon: MessageSquareWarning },
];

export function InspectorShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "I";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FC] lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[#1F2B6C] text-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/inspector" className="flex items-center gap-2 text-lg font-bold tracking-[0.06em]">
            <Building2 className="h-5 w-5" />
            INSPECTOR
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
            >
              ← Admin dashboard
            </Link>
          )}
        </nav>
      </aside>

      {sidebarOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-label="Close overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#E8EAF2] bg-white px-4 sm:px-6">
          <button type="button" className="rounded-lg p-2 text-ustawi-navy hover:bg-ustawi-cream lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ustawi-muted" />
            <input readOnly placeholder="Search cases" className="h-10 w-full rounded-full border border-[#E8EAF2] bg-[#F7F8FC] pl-10 pr-4 text-sm text-ustawi-muted" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell variant="light" />
            <ProfileAvatar src={user?.avatar} version={user?.avatar_updated_at} initials={initials} size="sm" className="ring-0 shadow-none" />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {title && <h1 className="mb-6 text-xl font-bold text-ustawi-navy sm:text-2xl">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
