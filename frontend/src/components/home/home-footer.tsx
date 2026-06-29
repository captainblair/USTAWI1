import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { UstawiLogoMark } from "@/components/brand/ustawi-logo";

const FOOTER_LINKS = {
  Explore: [
    { label: "Search homes", href: "/properties" },
    { label: "Featured listings", href: "/properties?ordering=-is_featured" },
    { label: "Westlands", href: "/properties?neighborhood=westlands&city=Nairobi" },
    { label: "Karen", href: "/properties?neighborhood=karen&city=Nairobi" },
  ],
  Platform: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Testimonials", href: "/#testimonials" },
    { label: "Why Ustawi", href: "/#why-ustawi" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ],
  Account: [
    { label: "Register", href: "/register" },
    { label: "Log in", href: "/login" },
    { label: "List a property", href: "/register" },
    { label: "Landlord dashboard", href: "/login" },
  ],
};

export function HomeFooter() {
  return (
    <footer data-scroll-tone="navy" className="relative overflow-hidden bg-[#0a1128] text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ustawi-red via-ustawi-red/80 to-ustawi-navy-light" />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-64 w-64 rounded-full bg-ustawi-red/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-ustawi-navy-light/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex rounded-lg bg-white/95 px-3 py-2 shadow-lg">
              <UstawiLogoMark variant="nav" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              Kenya&apos;s trusted rental platform — verified listings, safety scores, and M-Pesa
              payments for tenants and landlords across Nairobi.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ustawi-red" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-ustawi-red" />
                <a href="mailto:hello@ustawikenya.com" className="transition hover:text-white">
                  hello@ustawikenya.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-ustawi-red" />
                <span>+254 111 414 441</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/75 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/45">
            © {new Date().getFullYear()} Ustawi Kenya. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/45">
            <span>M-Pesa ready</span>
            <span className="hidden h-3 w-px bg-white/20 sm:block" />
            <span>Kenya Data Protection aligned</span>
            <span className="hidden h-3 w-px bg-white/20 sm:block" />
            <span>Nairobi-first</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
