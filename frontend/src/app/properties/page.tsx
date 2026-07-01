import { Suspense } from "react";
import { PropertyFilters } from "@/components/properties/property-filters";
import { PropertyGrid } from "@/components/properties/property-grid";
import { PropertyMap } from "@/components/properties/property-map-loader";
import {
  PropertySearchEmptyState,
  PropertySearchToolbar,
} from "@/components/properties/property-search-empty-state";
import { fetchFilterMetadata, fetchProperties } from "@/lib/api/properties";
import { hasActiveSearch } from "@/lib/search-params";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { FilterMetadata, PropertySearchParams } from "@/types/property";

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

export const metadata = createPageMetadata({
  title: "Search Homes",
  description:
    "Search verified rental properties in Nairobi by map area, radius, price, safety score, and neighborhood.",
  path: "/properties",
});

export default async function PropertiesPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const filters = toSearchParams(resolved);

  let apiReachable = true;

  const [metadata, listings] = await Promise.all([
    fetchFilterMetadata().catch(
      (): FilterMetadata => ({
        cities: ["Nairobi"],
        neighborhoods: [],
        property_types: [],
        amenities: [],
        price_range: { min: 0, max: 0 },
        suggestions_when_empty: [
          "Adjust price range",
          "Lower safety score filter",
          "Clear some amenities",
          "Explore nearby areas",
        ],
      }),
    ),
    (async () => {
      try {
        return await fetchProperties(filters);
      } catch {
        apiReachable = false;
        return {
          success: true as const,
          count: 0,
          next: null,
          previous: null,
          results: [],
        };
      }
    })(),
  ]);

  const showEmptyState = listings.count === 0 && hasActiveSearch(filters);
  const geoActive = Boolean(filters.bbox || (filters.lat && filters.lng && filters.radius));

  if (showEmptyState) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eef0f8] via-ustawi-cream to-[#fdeae8]/40">
        <div
          className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-ustawi-navy/5 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-[480px] h-64 w-64 rounded-full bg-ustawi-red/10 blur-3xl"
          aria-hidden
        />
        <Suspense fallback={<div className="h-24 animate-pulse bg-ustawi-navy/20" />}>
          <PropertySearchToolbar metadata={metadata} />
        </Suspense>
        <div className="relative mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <PropertySearchEmptyState
            metadata={metadata}
            suggestions={metadata.suggestions_when_empty}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Search</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Find your next home</h1>
          <p className="mt-2 text-ustawi-muted">
            Search by map area or radius, then filter by price, safety score, and neighborhood.
          </p>
        </div>

        {!apiReachable && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            We&apos;re having trouble loading listings right now. Please refresh the page or try again
            in a few minutes.
          </div>
        )}

        <div className="mb-8">
          <Suspense
            fallback={
              <div className="h-[320px] animate-pulse rounded-2xl border border-ustawi-border bg-white sm:h-[380px]" />
            }
          >
            <PropertyMap properties={listings.results} />
          </Suspense>
          {geoActive && (
            <p className="mt-2 text-xs text-ustawi-muted">
              Map search active
              {filters.bbox ? " · bounding box" : filters.radius ? ` · ${filters.radius} km radius` : ""}
              {" · "}
              combined with your other filters
            </p>
          )}
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
