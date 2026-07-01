"use client";

import Image from "next/image";
import { HERO_IMAGE } from "@/lib/assets/sample-properties";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { WireframeHeroSearch } from "@/components/home/wireframe-hero-search";

export function WireframeHero({
  stats,
}: {
  stats?: { propertyCount?: number; avgSafety?: string; neighborhoodCount?: number };
}) {
  const propertyCount = stats?.propertyCount;
  const avgSafety = stats?.avgSafety ?? "8.5";
  const neighborhoodCount = stats?.neighborhoodCount;

  return (
    <section data-scroll-tone="red" className="relative min-h-[480px] overflow-hidden sm:min-h-[560px] lg:min-h-[620px]">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0a1128]/92 via-[#0a1128]/72 to-[#ef3d32]/45"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a1128] via-[#0a1128]/40 to-transparent"
        aria-hidden
      />
      <div
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#ef3d32]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#ef3d32]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[480px] max-w-6xl flex-col items-center justify-center px-4 pb-28 pt-28 text-center sm:min-h-[560px] sm:px-6 sm:pb-32 sm:pt-32 lg:min-h-[620px]">
        <ScrollReveal variant="fade-up">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-ustawi-red" />
            Kenya&apos;s trusted rental platform
          </span>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.08}>
          <h1 className="max-w-3xl text-[2rem] font-bold leading-[1.2] tracking-tight text-white sm:text-5xl lg:text-[3rem]">
            Find Safe Homes in{" "}
            <span className="text-ustawi-red">Kenya</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.14}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Search by keyword or explore the map — verified listings, safety scores, and M-Pesa
            payments.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="scale" delay={0.2} className="mt-8 w-full sm:mt-10">
          <WireframeHeroSearch />
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.28} className="mt-8 w-full">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-normal text-white/75 sm:gap-10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {propertyCount != null && propertyCount > 0 ? propertyCount : "—"}
              </span>
              <span>Verified homes</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#4ade80]">M-Pesa</span>
              <span>Ready</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{avgSafety}+</span>
              <span>Avg. safety score</span>
            </div>
            {neighborhoodCount != null && neighborhoodCount > 0 && (
              <>
                <div className="hidden h-4 w-px bg-white/20 sm:block" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{neighborhoodCount}</span>
                  <span>Neighborhoods</span>
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
