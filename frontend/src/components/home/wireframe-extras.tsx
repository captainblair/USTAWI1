"use client";

import { ScrollReveal } from "@/components/home/scroll-reveal";

const items = [
  { title: "Nairobi, Westlands", line1: "Modern 2-bed apartment", line2: "Safety score 8.5 · Verified" },
  { title: "Nairobi, Kilimani", line1: "Spacious family unit", line2: "Safety score 9.0 · Verified" },
  { title: "Nairobi, Karen", line1: "Garden villa with parking", line2: "Safety score 8.8 · Verified" },
];

export function WireframeTestimonials() {
  return (
    <section id="testimonials" className="border-t border-ustawi-border bg-white py-14 sm:hidden">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-lg font-bold text-ustawi-navy">Testimonials</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <ScrollReveal key={item.title} variant="slide-right">
              <li className="flex items-center gap-3 rounded-[14px] bg-[#f0f0f2] p-4">
                <span className="h-12 w-12 shrink-0 rounded-full bg-[#d1d5db]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ustawi-navy">{item.title}</p>
                  <p className="truncate text-xs text-ustawi-muted">{item.line1}</p>
                  <p className="truncate text-xs text-ustawi-muted">{item.line2}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ustawi-gradient shadow-ustawi-red" />
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WireframeContact() {
  return (
    <section id="contact" className="hidden bg-ustawi-navy py-12 text-white sm:block">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-lg font-semibold">Contact us at hello@ustawikenya.com</p>
      </div>
    </section>
  );
}
