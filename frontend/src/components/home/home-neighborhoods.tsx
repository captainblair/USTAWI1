"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { Button } from "@/components/ui/button";

export type NeighborhoodChip = {
  name: string;
  slug: string;
  city: string;
};

const FALLBACK: NeighborhoodChip[] = [
  { name: "Westlands", slug: "westlands", city: "Nairobi" },
  { name: "Karen", slug: "karen", city: "Nairobi" },
  { name: "Kilimani", slug: "kilimani", city: "Nairobi" },
  { name: "Lavington", slug: "lavington", city: "Nairobi" },
  { name: "Parklands", slug: "parklands", city: "Nairobi" },
  { name: "Runda", slug: "runda", city: "Nairobi" },
];

type HomeNeighborhoodsProps = {
  neighborhoods: NeighborhoodChip[];
  cities?: string[];
};

export function HomeNeighborhoods({ neighborhoods, cities = [] }: HomeNeighborhoodsProps) {
  const areas = neighborhoods.length > 0 ? neighborhoods.slice(0, 8) : FALLBACK;
  const cityLabel = cities[0] ?? "Nairobi";

  return (
    <section data-scroll-tone="navy" id="browse-areas" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-ustawi-red">
                Popular areas
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ustawi-navy sm:text-3xl">
                Browse verified homes in {cityLabel}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ustawi-muted">
                Explore neighborhoods with safety-scored listings — updated live from our property
                catalogue.
              </p>
            </div>
            <Link href="/properties" className="shrink-0">
              <Button variant="outline" size="sm" className="gap-2">
                View all areas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area, i) => (
            <ScrollReveal key={area.slug} variant="fade-up" delay={i * 0.06}>
              <Link
                href={`/properties?neighborhood=${area.slug}&city=${encodeURIComponent(area.city)}`}
                className="group flex items-center gap-4 rounded-2xl border border-ustawi-border/70 bg-ustawi-cream/60 p-4 transition hover:border-ustawi-red/25 hover:bg-white hover:shadow-soft"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ustawi-navy text-white transition group-hover:bg-ustawi-red">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ustawi-navy">{area.name}</p>
                  <p className="truncate text-xs text-ustawi-muted">{area.city}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ustawi-muted opacity-0 transition group-hover:opacity-100 group-hover:text-ustawi-red" />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
