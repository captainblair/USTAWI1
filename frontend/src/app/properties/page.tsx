import { Suspense } from "react";
import { PropertyFilters } from "@/components/properties/property-filters";
import { PropertyGrid } from "@/components/properties/property-grid";
import { fetchFilterMetadata, fetchProperties } from "@/lib/api/properties";
import type { PropertySearchParams } from "@/types/property";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(raw: Record<string, string | string[] | undefined>): PropertySearchParams {
  const params: PropertySearchParams = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value === "string") {
      (params as Record<string, string>)[key] = value;
    }
  });
  return params;
}

export const metadata = {
  title: "Search Homes — Ustawi",
  description: "Search verified rental properties in Nairobi by price, safety score, and amenities.",
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const filters = toSearchParams(resolved);

  const [metadata, listings] = await Promise.all([
    fetchFilterMetadata().catch(() => ({
      cities: ["Nairobi"],
      neighborhoods: [],
      property_types: [],
      amenities: [],
      price_range: { min: 0, max: 0 },
    })),
    fetchProperties(filters).catch(() => ({
      success: true as const,
      count: 0,
      next: null,
      previous: null,
      results: [],
    })),
  ]);

  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Search</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Find your next home</h1>
          <p className="mt-2 text-ustawi-muted">
            Filter by neighborhood, price, safety score, and more.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
              <PropertyFilters metadata={metadata} />
            </Suspense>
          </aside>
          <PropertyGrid properties={listings.results} count={listings.count} />
        </div>
      </div>
    </div>
  );
}
