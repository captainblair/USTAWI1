"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UstawiLogo } from "@/components/brand/ustawi-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { APP_NAV_LINKS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  function isActive(link: (typeof APP_NAV_LINKS)[number]) {
    if (link.matchPath) {
      return pathname === link.matchPath || pathname.startsWith(`${link.matchPath}/`);
    }
    return false;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ustawi-border bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-[80px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <UstawiLogo variant="nav" />

        <nav className="ml-10 hidden flex-1 items-center gap-8 lg:flex">
          {APP_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[15px] font-medium text-ustawi-navy/70 transition hover:text-ustawi-navy",
                isActive(link) && "font-semibold text-ustawi-navy",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
