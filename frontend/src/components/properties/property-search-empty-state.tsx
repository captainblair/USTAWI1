"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import {
  ArrowRight,
  Globe,
  Lightbulb,
  MapPin,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { HouseSearchIcon } from "@/components/properties/search-empty-illustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildFilterChips,
  paramsToQueryString,
  removeFilterParams,
} from "@/lib/search-params";
import type { FilterMetadata, PropertySearchParams } from "@/types/property";

function parseFilters(searchParams: URLSearchParams): PropertySearchParams {
  const filters: PropertySearchParams = {};
  searchParams.forEach((value, key) => {
    (filters as Record<string, string>)[key] = value;
  });
  return filters;
}

export function PropertySearchToolbar({ metadata }: { metadata: FilterMetadata }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseFilters(searchParams);
  const chips = buildFilterChips(filters, metadata);
  const query = searchParams.get("q") ?? searchParams.get("city") ?? "Nairobi, Kenya";

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const q = String(form.get("q") ?? "").trim();
    if (q) {
      params.set("q", q);
      params.set("city", "Nairobi");
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => router.push(`/properties?${params.toString()}`));
  }

  function removeChip(paramKeys: string[]) {
    const next = removeFilterParams(filters, paramKeys);
    startTransition(() => router.push(`/properties${paramsToQueryString(next)}`));
  }

  return (
    <div className="relative border-b border-white/10 bg-gradient-to-r from-[#0a1128] via-ustawi-navy to-[#1a2560]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(239,61,50,0.12),transparent_45%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
        <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ustawi-muted" />
            <Input
              name="q"
              defaultValue={query === "Nairobi, Kenya" ? "" : query}
              placeholder="Nairobi, Kenya"
              className="h-12 rounded-full border-white/20 bg-white pl-12 pr-4 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            />
          </div>
          <Button type="submit" disabled={isPending} className="hidden h-12 rounded-full px-6 sm:inline-flex">
            Search
          </Button>
        </form>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => removeChip(chip.paramKeys)}
                  className="rounded-full p-0.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-white/60 sm:hidden">
        <span>Filters</span>
        <Globe className="h-4 w-4" />
      </div>
    </div>
  );
}

type PropertySearchEmptyStateProps = {
  metadata: FilterMetadata;
  suggestions?: string[];
};

const FALLBACK_NEIGHBORHOODS = [
  { name: "Westlands", slug: "westlands", city: "Nairobi" },
  { name: "Kilimani", slug: "kilimani", city: "Nairobi" },
  { name: "Parklands", slug: "parklands", city: "Nairobi" },
  { name: "Runda", slug: "runda", city: "Nairobi" },
];

const TIP_ICONS = [Lightbulb, Shield, Sparkles, MapPin];

function NeighborhoodMiniCard({ name, href }: { name: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex w-[118px] flex-col items-center gap-3 sm:w-[128px]"
    >
      <div className="relative flex aspect-square h-[92px] w-[92px] items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-white to-ustawi-cream p-3 shadow-[0_8px_24px_rgba(31,43,108,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:border-ustawi-red/30 group-hover:shadow-[0_12px_32px_rgba(239,61,50,0.15)] sm:h-[100px] sm:w-[100px]">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-ustawi-red/5 to-ustawi-navy/5 opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
        <HouseSearchIcon variant="card" />
      </div>
      <span className="text-center text-xs font-semibold text-white group-hover:text-ustawi-red">
        {name}
      </span>
    </Link>
  );
}

export function PropertySearchEmptyState({ metadata, suggestions }: PropertySearchEmptyStateProps) {
  const tips =
    suggestions?.filter((s) => s !== "Explore nearby areas") ?? [
      "Adjust price range",
      "Lower safety score filter",
      "Clear some amenities",
    ];

  const neighborhoods =
    metadata.neighborhoods.length > 0
      ? metadata.neighborhoods.slice(0, 4)
      : FALLBACK_NEIGHBORHOODS;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Main empty card */}
      <div className="relative rounded-3xl border border-ustawi-border/50 bg-white shadow-[0_20px_60px_rgba(31,43,108,0.08)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 overflow-hidden rounded-t-3xl bg-gradient-to-r from-ustawi-red via-ustawi-red/80 to-ustawi-navy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ustawi-red/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-ustawi-navy/10 blur-3xl"
          aria-hidden
        />

        <div className="relative px-6 py-10 sm:px-12 sm:py-14">
          <div className="flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center">
              <div
                className="pointer-events-none absolute h-44 w-44 rounded-full bg-gradient-to-br from-ustawi-coral-light to-[#eef0f8] blur-md sm:h-48 sm:w-48"
                aria-hidden
              />
              <div className="relative rounded-2xl bg-gradient-to-br from-[#fff5f4] via-white to-[#eef1fb] px-6 py-5 shadow-inner ring-1 ring-ustawi-border/40 sm:px-8 sm:py-6">
                <HouseSearchIcon variant="hero" />
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ustawi-red">
              No results
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ustawi-navy sm:text-3xl">
              No matching homes found
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ustawi-muted sm:text-[15px]">
              Try adjusting your search filters for more results
            </p>

            <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-3">
              {tips.slice(0, 3).map((tip, i) => {
                const Icon = TIP_ICONS[i] ?? Lightbulb;
                return (
                  <div
                    key={tip}
                    className="flex flex-col items-center gap-2 rounded-xl border border-ustawi-border/60 bg-gradient-to-b from-ustawi-cream/80 to-white px-3 py-4 text-center"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ustawi-navy/10 text-ustawi-navy">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium leading-snug text-ustawi-navy/85">{tip}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/properties" className="sm:flex-1 sm:max-w-[200px]">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-full border-2 border-ustawi-navy py-2.5 text-ustawi-navy hover:bg-ustawi-navy hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </Link>
              <Link
                href="/properties?city=Nairobi"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white shadow-ustawi-red transition hover:bg-ustawi-red-hover sm:flex-1 sm:max-w-[220px]"
              >
                Explore Nearby Areas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended neighborhoods band */}
      <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-ustawi-navy via-[#1a2560] to-[#0a1128] px-6 py-10 sm:mt-12 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-ustawi-red/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ustawi-red">Explore</p>
            <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">Recommended Neighborhoods</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/65">
              Popular verified areas in Nairobi — tap to browse listings
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-start justify-center gap-5 sm:gap-8">
            {neighborhoods.map((n) => (
              <NeighborhoodMiniCard
                key={n.slug}
                name={n.name}
                href={`/properties?neighborhood=${n.slug}&city=${encodeURIComponent(n.city)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ustawi-border/60 bg-white/95 p-4 backdrop-blur-md sm:hidden">
        <Link
          href="/register"
          className="flex w-full items-center justify-center rounded-xl bg-ustawi-red py-3.5 text-sm font-semibold text-white shadow-ustawi-red"
        >
          Save Search
        </Link>
      </div>
      <div className="h-20 sm:hidden" aria-hidden />
    </div>
  );
}
