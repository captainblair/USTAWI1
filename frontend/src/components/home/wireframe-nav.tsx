"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { UstawiLogo } from "@/components/brand/ustawi-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#how-it-works", label: "How it works", active: true },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

export function WireframeNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0a1128]/25 backdrop-blur-xl">
      <div className="mx-auto hidden h-[72px] max-w-6xl items-center px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <UstawiLogo variant="nav" priority inverted />

        <nav className="flex items-center justify-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-[15px] font-medium text-white/75 transition hover:text-white",
                link.active && "border-b-2 border-[#ff6b5a] pb-1 text-white",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-5">
          <Link href="/login" className="text-[15px] font-medium text-white/80 hover:text-white">
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="min-w-[130px] rounded-[12px] px-5 py-2.5 text-[13px] shadow-ustawi-red">
              Login/Register
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex h-[64px] items-center justify-between px-4 md:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-white"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <UstawiLogo variant="compact" priority inverted />
        </div>

        <Link href="/register">
          <Button size="sm" className="rounded-[10px] px-3 py-1.5 text-xs shadow-ustawi-red">
            Register
          </Button>
        </Link>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0a1128]/90 px-4 py-4 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2.5 text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" className="mt-3 block text-sm font-medium text-white/80" onClick={() => setOpen(false)}>
            Login
          </Link>
        </div>
      )}
    </header>
  );
}
