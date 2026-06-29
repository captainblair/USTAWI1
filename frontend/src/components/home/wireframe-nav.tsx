"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { UstawiLogo } from "@/components/brand/ustawi-logo";
import { Button } from "@/components/ui/button";
import { HOME_NAV_LINKS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  label,
  active,
  scrolled,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  scrolled: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-[15px] font-medium transition-colors",
        scrolled ? "text-[#0a1128]/75 hover:text-[#0a1128]" : "text-white/80 hover:text-white",
        active &&
          (scrolled
            ? "border-b-2 border-ustawi-red pb-1 text-[#0a1128]"
            : "border-b-2 border-ustawi-red pb-1 text-white"),
      )}
    >
      {label}
    </Link>
  );
}

export function WireframeNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    const onHash = () => setHash(window.location.hash.replace("#", ""));
    onScroll();
    onHash();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  function isActive(link: (typeof HOME_NAV_LINKS)[number]) {
    if (link.matchHash && pathname === "/") {
      return hash === link.matchHash;
    }
    return false;
  }

  const logoTone = scrolled ? "onLight" : "onDark";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-ustawi-border bg-white/95 shadow-[0_4px_24px_rgba(10,17,40,0.06)] backdrop-blur-md"
          : "border-b border-white/10 bg-[#0a1128]/20 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto hidden h-[80px] max-w-7xl items-center px-6 lg:flex lg:px-8">
        <UstawiLogo variant="nav" priority tone={logoTone} />

        <nav className="ml-12 flex items-center gap-9">
          {HOME_NAV_LINKS.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(link)}
              scrolled={scrolled}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-7">
          <Link
            href="/login"
            className={cn(
              "text-[15px] font-medium transition",
              scrolled ? "text-[#0a1128]/75 hover:text-[#0a1128]" : "text-white/85 hover:text-white",
            )}
          >
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="min-w-[120px] px-6 shadow-ustawi-red">
              Register
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex h-[72px] items-center justify-between px-4 lg:hidden">
        <UstawiLogo variant="compact" priority tone={logoTone} />

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium",
              scrolled ? "text-[#0a1128]/75" : "text-white/85",
            )}
          >
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="px-4 shadow-ustawi-red">
              Register
            </Button>
          </Link>
          <button
            type="button"
            className={cn("rounded-lg p-2", scrolled ? "text-[#0a1128]" : "text-white")}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-4 py-4 lg:hidden",
            scrolled
              ? "border-ustawi-border bg-white"
              : "border-white/10 bg-[#0a1128]/95 backdrop-blur-xl",
          )}
        >
          {HOME_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-2.5 text-sm font-medium",
                scrolled ? "text-[#0a1128]/80" : "text-white",
                isActive(link) && "font-semibold text-ustawi-red",
              )}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
