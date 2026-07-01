"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const MENU_LINKS = [
  { href: "/properties", label: "Search homes" },
  { href: "/applications", label: "Applications" },
  { href: "/leases", label: "Leases" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/notifications", label: "Notifications" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
];

function NotificationsHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/properties?q=${encodeURIComponent(q)}` : "/properties");
    setMenuOpen(false);
  }

  return (
    <header className="bg-[#1F2B6C] text-white">
      <div className="px-4 py-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 text-xl font-bold tracking-[0.06em] text-white" aria-label="Ustawi home">
            USTAWI
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
        <form onSubmit={handleSearch} className="mt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search homes, neighborhoods…"
              className="h-[44px] w-full rounded-full border-0 bg-white pl-11 pr-4 text-[14px] text-[#1F2B6C] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-white/40"
            />
          </div>
        </form>
      </div>

      <div className="mx-auto hidden h-[68px] max-w-[1180px] items-center justify-between gap-4 px-8 sm:flex">
        <Link href="/" className="shrink-0 text-[22px] font-bold tracking-[0.06em] text-white" aria-label="Ustawi home">
          USTAWI
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3">
          <form onSubmit={handleSearch} className="w-full max-w-[320px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-[38px] w-full rounded-full border-0 bg-white pl-10 pr-4 text-[13px] text-[#1F2B6C] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-white/40"
              />
            </div>
          </form>
          <NotificationBell />
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-white hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/15 bg-[#1F2B6C] px-4 py-4 sm:px-8 lg:hidden">
          {MENU_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block border-b border-white/10 py-3 text-[15px] font-medium text-white/90 last:border-0"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function NotificationsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FC]">
      <NotificationsHeader />
      <main className="min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
