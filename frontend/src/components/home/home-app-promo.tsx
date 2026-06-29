"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { UstawiLogoMark } from "@/components/brand/ustawi-logo";
import { Button } from "@/components/ui/button";

function PhoneMockup() {
  return (
    <div className="relative w-[130px] shrink-0 sm:w-[150px]">
      <div className="rounded-[1.75rem] border-[6px] border-[#1c1c1e] bg-[#1c1c1e] p-1 shadow-lg">
        <div className="relative aspect-[9/18] overflow-hidden rounded-[1.35rem] bg-white">
          <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-12 -translate-x-1/2 rounded-full bg-[#1c1c1e]" />
          <div className="flex h-full items-center justify-center bg-white px-3 pt-6">
            <UstawiLogoMark variant="compact" />
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="h-0.5 bg-ustawi-red" />
            <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="h-10 w-full text-[#0a1128]" aria-hidden>
              <path fill="currentColor" d="M0,30 C80,60 160,0 240,30 C320,60 360,10 400,30 L400,60 L0,60 Z" />
            </svg>
            <div className="bg-[#0a1128] px-2 pb-2 pt-0.5 text-center">
              <p className="text-[8px] leading-tight text-white/85">Verified homes in Kenya</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeAppPromo() {
  return (
    <section data-scroll-tone="navy" className="w-full bg-[#0a1128] py-8 sm:py-10">
      <ScrollReveal variant="fade-up">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-8 lg:px-12">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <PhoneMockup />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              Register Now!
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/80 sm:mx-0 sm:text-[15px]">
              Ustawi — your trusted partner for safe, verified rentals in Kenya.
            </p>
            <Link href="/register" className="mt-5 inline-block">
              <Button size="md" className="rounded-full px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
