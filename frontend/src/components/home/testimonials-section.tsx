"use client";

import { ScrollReveal } from "@/components/home/scroll-reveal";

const testimonials = [
  {
    quote:
      "I found a verified apartment in Kilimani within a week. The safety score gave me peace of mind before I even visited.",
    name: "Grace W.",
    role: "Tenant · Nairobi",
  },
  {
    quote:
      "As a landlord, Ustawi helped me screen tenants properly and collect rent through M-Pesa without chasing payments.",
    name: "James M.",
    role: "Landlord · Westlands",
  },
  {
    quote:
      "The digital lease and receipts made everything transparent. Finally a platform built for how Kenyans actually rent.",
    name: "Amina K.",
    role: "Tenant · Karen",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-y border-ustawi-border bg-ustawi-sand/50 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up" className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Testimonials</p>
          <h2 className="mt-3 text-3xl font-bold text-ustawi-navy sm:text-4xl">Trusted by renters across Kenya</h2>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <ScrollReveal key={item.name} variant="fade-up" delay={index * 0.1}>
              <blockquote className="h-full rounded-2xl border border-ustawi-border bg-white p-8 shadow-sm">
                <p className="text-base leading-relaxed text-ustawi-navy/90">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 border-t border-ustawi-border pt-4">
                  <p className="font-bold text-ustawi-navy">{item.name}</p>
                  <p className="text-sm text-ustawi-muted">{item.role}</p>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
