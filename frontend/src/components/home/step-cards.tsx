"use client";

import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";

const steps = [
  {
    number: "1",
    title: "Search",
    description: "Find verified homes by location, price, and safety score across Kenya.",
    icon: Search,
  },
  {
    number: "2",
    title: "View & Compare",
    description: "Compare listings side-by-side with photos, amenities, and trust ratings.",
    icon: SlidersHorizontal,
  },
  {
    number: "3",
    title: "Settle Safely",
    description: "Apply, sign digitally, and pay rent via M-Pesa — all on one secure platform.",
    icon: ShieldCheck,
  },
];

export function StepCards() {
  return (
    <section className="relative z-10 -mt-20 px-4 sm:-mt-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3 sm:gap-6">
        {steps.map((step, index) => (
          <ScrollReveal key={step.number} variant="fade-up" delay={index * 0.1}>
            <div className="rounded-2xl border border-ustawi-border/80 bg-white p-6 shadow-xl shadow-ustawi-navy/5 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ustawi-red text-lg font-bold text-white shadow-lg shadow-ustawi-red/25">
                  {step.number}
                </span>
                <step.icon className="h-6 w-6 text-ustawi-navy/40" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ustawi-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ustawi-muted">{step.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
