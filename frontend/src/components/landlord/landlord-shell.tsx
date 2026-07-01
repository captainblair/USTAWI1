"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/landlord", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/landlord/properties", label: "Properties", icon: Building2 },
  { href: "/landlord/applications", label: "Applications", icon: FileText },
  { href: "/landlord/leases", label: "Leases", icon: Users },
  { href: "/landlord/maintenance", label: "Maintenance", icon: Wrench },
  { href: "#", label: "Messages", icon: MessageSquare, disabled: true },
  { href: "/profile", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LandlordShell({
  children,
  title = "Overview",
  action,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  const initials =
    user?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? user?.email[0]?.toUpperCase() ?? "L";

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/properties?q=${encodeURIComponent(q)}` : "/properties");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FC] lg:flex">
      {/* Sidebar — wireframe dark nav */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[#1F2B6C] text-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/landlord" className="text-lg font-bold tracking-[0.06em]">
            USTAWI
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = !item.disabled && isActive(pathname, item.href, item.exact);
            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/35"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {item.label}
                </span>
              );
            }
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
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#E8EAF2] bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-ustawi-navy hover:bg-ustawi-cream lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <form onSubmit={handleSearch} className="hidden max-w-md flex-1 sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ustawi-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-full border border-[#E8EAF2] bg-[#F7F8FC] pl-10 pr-4 text-sm text-ustawi-navy outline-none focus:border-ustawi-navy/30"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell variant="light" />
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
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {(title || action) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 sm:mb-6">
              {title ? <h1 className="text-xl font-bold text-ustawi-navy sm:text-2xl">{title}</h1> : null}
              {action}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function LandlordAddPropertyButton() {
  return (
    <Link
      href="/landlord/properties/new"
      className="inline-flex h-10 items-center rounded-lg bg-[#EF3D32] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#EF3D32]/90"
    >
      Add Property
    </Link>
  );
}
