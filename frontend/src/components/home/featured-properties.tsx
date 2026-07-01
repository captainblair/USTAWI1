import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/types/property";

export function FeaturedProperties({ properties }: { properties: PropertyListItem[] }) {
  return (
    <section className="bg-ustawi-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">
              Featured Listings
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ustawi-navy sm:text-4xl">
              Safe homes, hand-picked for you
            </h2>
            <p className="mt-3 max-w-xl text-ustawi-muted">
              Every featured property is verified with a safety score — so you know what you&apos;re
              walking into before you apply.
            </p>
          </div>
          <Link href="/properties">
            <Button variant="outline" className="gap-2">
              View all homes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-ustawi-border bg-white p-12 text-center">
            <p className="text-lg font-semibold text-ustawi-navy">Featured listings coming soon</p>
            <p className="mt-2 text-ustawi-muted">
              We&apos;re curating verified homes for this section. Explore all listings to find your next
              place today.
            </p>
            <Link href="/properties" className="mt-6 inline-block">
              <Button>Browse search</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
