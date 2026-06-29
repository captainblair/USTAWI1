"use client";

import { ScrollReveal } from "@/components/home/scroll-reveal";

const TESTIMONIALS = [
  {
    quote: "Ustawi made finding a verified apartment in Westlands stress-free. The safety score gave me real peace of mind.",
    name: "Grace M.",
    role: "Tenant · Nairobi",
  },
  {
    quote: "As a landlord, I love how transparent the platform is. M-Pesa rent collection just works.",
    name: "James K.",
    role: "Landlord · Karen",
  },
  {
    quote: "Finally a platform that takes tenant safety seriously. The verification process is top-notch.",
    name: "Amina O.",
    role: "Tenant · Kilimani",
  },
];

export function HomeTestimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 bg-ustawi-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal variant="fade-up">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-ustawi-red">Testimonials</p>
            <h2 className="mt-2 text-2xl font-semibold text-ustawi-navy sm:text-3xl">
              Trusted by renters & landlords
            </h2>
          </div>
        </ScrollReveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <ScrollReveal key={item.name} variant="fade-up" delay={i * 0.12}>
              <blockquote className="h-full rounded-2xl border border-ustawi-border/60 bg-white p-6 shadow-soft">
                <p className="text-sm leading-relaxed text-ustawi-navy/85">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-5 border-t border-ustawi-border/50 pt-4">
                  <p className="text-sm font-semibold text-ustawi-navy">{item.name}</p>
                  <p className="text-xs font-normal text-ustawi-muted">{item.role}</p>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeContact() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-ustawi-border bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <ScrollReveal variant="fade-up">
          <h2 className="text-xl font-semibold text-ustawi-navy sm:text-2xl">Get in touch</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ustawi-muted">
            Questions about listings, verification, or becoming a landlord partner? We&apos;re here to help.
          </p>
          <a
            href="mailto:hello@ustawikenya.com"
            className="mt-6 inline-flex items-center rounded-lg bg-ustawi-coral-light px-6 py-3 text-sm font-medium text-ustawi-red transition hover:bg-ustawi-coral-light/80"
          >
            hello@ustawikenya.com
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
