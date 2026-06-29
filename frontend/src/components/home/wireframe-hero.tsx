"use client";

import Image from "next/image";
import { HERO_IMAGE } from "@/lib/assets/sample-properties";
import { WireframeHeroSearch } from "@/components/home/wireframe-hero-search";

export function WireframeHero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden sm:min-h-[620px] lg:min-h-[680px]">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Layered overlays — navy + brand red for depth and readability */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0a1128]/92 via-[#0a1128]/72 to-[#8b0618]/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a1128] via-[#0a1128]/40 to-transparent"
        aria-hidden
      />
      <div
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#ef2438]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#ff6b5a]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center px-4 pb-32 pt-28 text-center sm:min-h-[620px] sm:px-6 sm:pb-40 sm:pt-32 lg:min-h-[680px]">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-ustawi-gradient shadow-ustawi-red" />
          Kenya&apos;s trusted rental platform
        </span>

        <h1 className="max-w-3xl text-[2rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
          Find Safe Homes in{" "}
          <span className="bg-gradient-to-r from-[#ff8a7a] via-[#ff4d5e] to-[#ffb4a8] bg-clip-text text-transparent">
            Kenya
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Verified listings, safety scores, and M-Pesa payments — secure living made simple.
        </p>

        <div className="mt-8 w-full sm:mt-10">
          <WireframeHeroSearch />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70 sm:gap-10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">500+</span>
            <span>Verified homes</span>
          </div>
          <div className="hidden h-4 w-px bg-white/25 sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#4ade80]">M-Pesa</span>
            <span>Ready</span>
          </div>
          <div className="hidden h-4 w-px bg-white/25 sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">8.5+</span>
            <span>Avg. safety score</span>
          </div>
        </div>
      </div>
    </section>
  );
}
