"use client";

import { HeroCarousel } from "@/components/home/hero-carousel";
import { HeroSearch } from "@/components/home/hero-search";
import { HomeNavbar } from "@/components/home/home-navbar";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { TrustBadgesRow } from "@/components/home/trust-badges";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
      <HeroCarousel />
      <HomeNavbar />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-32 pt-28 sm:px-6 sm:pb-36 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollReveal variant="fade-up">
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Find Safe Homes in Kenya
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={0.12}>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Your trusted platform for secure living Kenya
            </p>
          </ScrollReveal>

          <ScrollReveal variant="scale" delay={0.22} className="mt-10">
            <HeroSearch />
          </ScrollReveal>

          <ScrollReveal variant="fade-in" delay={0.35} className="mt-8">
            <TrustBadgesRow />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
