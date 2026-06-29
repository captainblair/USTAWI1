import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Search Homes", href: "/properties" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "For Landlords", href: "/#for-landlords" },
  ],
  Account: [
    { label: "Log in", href: "/login" },
    { label: "Register", href: "/register" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-ustawi-border bg-ustawi-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ustawi-red">
                <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-xl font-bold">Ustawi</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Find safe homes. Rent with confidence. Thrive where you live. Verified rental platform
              built for Nairobi and Kenya.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/80 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/50">© {new Date().getFullYear()} Ustawi Kenya. All rights reserved.</p>
          <p className="text-sm text-white/50">Nairobi-first · M-Pesa ready · Kenya Data Protection aligned</p>
        </div>
      </div>
    </footer>
  );
}
