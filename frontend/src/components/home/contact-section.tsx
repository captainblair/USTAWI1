"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { TrustBadgesRow } from "@/components/home/trust-badges";
import { UstawiLogo } from "@/components/brand/ustawi-logo";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="bg-ustawi-navy py-24 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal variant="slide-left">
            <UstawiLogo variant="full" />
            <h2 className="mt-8 text-3xl font-bold sm:text-4xl">Ready to find your safe home?</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/75">
              Get in touch with our team or start searching verified listings across Nairobi and beyond.
            </p>
            <TrustBadgesRow className="mt-8 justify-start" />
          </ScrollReveal>

          <ScrollReveal variant="slide-right">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold">Contact us</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex items-center gap-3 text-white/85">
                  <Mail className="h-5 w-5 text-ustawi-red" />
                  hello@ustawikenya.com
                </li>
                <li className="flex items-center gap-3 text-white/85">
                  <Phone className="h-5 w-5 text-ustawi-red" />
                  +254 700 000 000
                </li>
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/properties" className="flex-1">
                  <Button size="lg" className="w-full rounded-2xl">
                    Search properties
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    Register free
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  return (
    <footer className="border-t border-ustawi-border bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <UstawiLogo variant="compact" />
        <p className="text-sm text-ustawi-muted">© {new Date().getFullYear()} Ustawi Kenya. All rights reserved.</p>
      </div>
    </footer>
  );
}
