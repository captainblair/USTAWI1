"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "What is Ustawi and who is it for?",
    answer:
      "Ustawi is a verified rental platform built for Kenya. Tenants can search safe, scored homes in Nairobi; landlords and agents can list properties, manage applications, and collect rent via M-Pesa.",
  },
  {
    question: "How does property verification work?",
    answer:
      "Every active listing goes through our verification workflow — identity checks, listing review, and safety scoring. Verified homes display a Ustawi badge and safety score so you know what you are renting before you commit.",
  },
  {
    question: "What is a safety score?",
    answer:
      "Safety scores rate a property and its surroundings on a 0–10 scale using factors like location, building condition, and community feedback. Higher scores indicate stronger overall safety and trust signals.",
  },
  {
    question: "Can I pay rent with M-Pesa?",
    answer:
      "Yes. Ustawi supports M-Pesa for rent payments and billing. Tenants receive digital receipts; landlords get clear payment tracking from their dashboard.",
  },
  {
    question: "Can I pay with PayPal for larger amounts?",
    answer:
      "PayPal is coming soon on Ustawi. M-Pesa has a per-transaction limit (around KES 500,000), so PayPal will let tenants and landlords settle higher rent amounts securely when it launches.",
  },
  {
    question: "How do I apply for a property?",
    answer:
      "Create a free account, browse listings, and submit an application from any property detail page. Landlords review applications in their inbox and can approve, decline, or request more information.",
  },
  {
    question: "How much does it cost to list a property?",
    answer:
      "Register as a landlord to publish your first listing. Pricing and any premium placement options are shown during registration — there are no hidden agency fees for tenants browsing on Ustawi.",
  },
  {
    question: "Which areas do you cover?",
    answer:
      "We are Nairobi-first, with verified listings across neighborhoods like Westlands, Karen, Kilimani, Lavington, and more. Coverage expands as new verified properties are added to the catalogue.",
  },
  {
    question: "How do I get help or report an issue?",
    answer:
      "Email hello@ustawikenya.com or use the contact section below. For listing or payment disputes, logged-in users can also reach support from their dashboard.",
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-ustawi-border/70 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left transition hover:text-ustawi-red"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ustawi-navy sm:text-[15px]">{question}</span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 text-ustawi-muted transition-transform duration-200",
            open && "rotate-180 text-ustawi-red",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="pr-8 text-sm leading-relaxed text-ustawi-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section data-scroll-tone="navy" id="faq" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start lg:gap-14">
          <ScrollReveal variant="fade-up">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-medium uppercase tracking-wider text-ustawi-red">FAQ</p>
              <h2 className="mt-2 text-2xl font-semibold text-ustawi-navy sm:text-3xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ustawi-muted">
                Everything you need to know about searching, verifying, and renting through Ustawi.
                Can&apos;t find your answer?{" "}
                <Link href="/#contact" className="font-medium text-ustawi-red hover:underline">
                  Get in touch
                </Link>
                .
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={0.1}>
            <div className="rounded-2xl border border-ustawi-border/70 bg-ustawi-cream/40 px-5 shadow-soft sm:px-6">
              {FAQ_ITEMS.map((item, index) => (
                <FaqItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  open={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
