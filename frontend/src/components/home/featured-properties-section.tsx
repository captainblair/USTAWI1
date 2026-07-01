"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/types/property";

export function FeaturedPropertiesSection({ properties }: { properties: PropertyListItem[] }) {
  return (
    <section className="bg-ustawi-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up" className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">
              Featured Properties
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ustawi-navy sm:text-4xl">
              Hand-picked safe homes
            </h2>
            <p className="mt-3 max-w-xl text-ustawi-muted">
              Verified listings with safety scores, transparent pricing, and trusted landlords.
            </p>
          </div>
          <Link href="/properties">
            <Button variant="outline" className="gap-2 rounded-2xl">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </ScrollReveal>

        {properties.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property, index) => (
              <ScrollReveal key={property.id} variant="fade-up" delay={index * 0.08}>
                <PropertyCard property={property} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal variant="scale" className="mt-12">
            <div className="rounded-2xl border border-dashed border-ustawi-border bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-ustawi-navy">Featured listings coming soon</p>
              <p className="mt-2 text-sm text-ustawi-muted">
                New verified homes are added regularly. Browse all available listings in the meantime.
              </p>
              <Link href="/properties" className="mt-6 inline-block">
                <Button className="rounded-2xl">Browse search</Button>
              </Link>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
