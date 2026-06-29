import Link from "next/link";
import { UstawiLogo } from "@/components/brand/ustawi-logo";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ustawi-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <UstawiLogo variant="nav" />

        <nav className="hidden items-center gap-8 lg:flex">
          <Link href="/properties" className="text-sm font-medium text-ustawi-navy/80 hover:text-ustawi-navy">
            Search
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-ustawi-navy/80 hover:text-ustawi-navy">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-ustawi-navy/80 sm:block">
            Login
          </Link>
          <Link href="/register">
            <Button size="sm">Login/Register</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
