"use client";

import { Globe2, Shield, Sparkles, Wallet } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";

const pillars = [
  {
    icon: Shield,
    title: "Trust",
    description:
      "Verified listings, inspector workflows, and community reporting you can act on.",
  },
  {
    icon: Sparkles,
    title: "Safety",
    description:
      "Safety scores on every home — so you know the neighborhood before you commit.",
  },
  {
    icon: Wallet,
    title: "Transparency",
    description:
      "Clear pricing, digital leases, and payment receipts. No hidden agency fees.",
  },
  {
    icon: Globe2,
    title: "Local-first",
    description:
      "M-Pesa rent, +254 OTP, Nairobi neighborhoods. Built for how Kenya actually rents.",
  },
];

export function TrustPillars() {
  return (
    <section
      data-scroll-tone="navy"
      id="why-ustawi"
      className="scroll-mt-24 bg-ustawi-navy py-20 text-white sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">
              Why Ustawi
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Renting in Nairobi shouldn&apos;t feel like a gamble
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }, i) => (
            <ScrollReveal key={title} variant="fade-up" delay={i * 0.08}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ustawi-red/90">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
