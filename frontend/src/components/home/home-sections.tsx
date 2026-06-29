"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { Button } from "@/components/ui/button";

export function HomeTestimonials() {
  const testimonials = [
    {
      quote:
        "Ustawi made finding a verified apartment in Westlands stress-free. The safety score gave me real peace of mind.",
      name: "Grace M.",
      role: "Tenant · Nairobi",
    },
    {
      quote:
        "As a landlord, I love how transparent the platform is. M-Pesa rent collection just works.",
      name: "James K.",
      role: "Landlord · Karen",
    },
    {
      quote:
        "Finally a platform that takes tenant safety seriously. The verification process is top-notch.",
      name: "Amina O.",
      role: "Tenant · Kilimani",
    },
  ];

  return (
    <section data-scroll-tone="red" id="testimonials" className="scroll-mt-24 bg-ustawi-cream py-16 sm:py-20">
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
          {testimonials.map((item, i) => (
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
    <section data-scroll-tone="navy" id="contact" className="scroll-mt-24 border-t border-ustawi-border bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal variant="fade-up">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-ustawi-navy to-[#0a1128] p-8 sm:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-ustawi-red">Contact</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  We&apos;re here to help you find home
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                  Questions about listings, verification, or becoming a landlord partner? Reach out
                  and our Nairobi team will get back to you within one business day.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:hello@ustawikenya.com"
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ustawi-red">
                    <Mail className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/50">Email</p>
                    <p className="text-sm font-semibold text-white">hello@ustawikenya.com</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/50">Support</p>
                    <p className="text-sm text-white/80">Mon – Fri, 8am – 6pm EAT</p>
                  </div>
                </div>
                <Link href="/properties">
                  <Button className="mt-2 w-full gap-2 sm:w-auto">
                    Browse listings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
