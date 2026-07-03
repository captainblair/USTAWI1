"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Home, Search, X } from "lucide-react";
import { FormEvent, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildFilterChips,
  getSearchContextLabel,
  paramsToQueryString,
  removeFilterParams,
} from "@/lib/search-params";
import type { FilterMetadata, PropertySearchParams } from "@/types/property";
import { cn } from "@/lib/utils";

function parseFilters(searchParams: URLSearchParams): PropertySearchParams {
  const filters: PropertySearchParams = {};
  searchParams.forEach((value, key) => {
    (filters as Record<string, string>)[key] = value;
  });
  return filters;
}

type PropertySearchContextBarProps = {
  metadata: FilterMetadata;
  /** Dark gradient bar (empty state) vs light bar on results page */
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Sticky search bar on /properties with a clear Home link back to the landing page.
 * Shows the active area (e.g. Karen) so users always know where they are.
 */
export function PropertySearchContextBar({
  metadata,
  variant = "dark",
  className,
}: PropertySearchContextBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseFilters(searchParams);
  const chips = buildFilterChips(filters, metadata);
  const contextLabel = getSearchContextLabel(filters, metadata);
  const isDark = variant === "dark";

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

  const inputDefault =
    searchParams.get("q") ??
    (filters.neighborhood
      ? metadata.neighborhoods.find((n) => n.slug === filters.neighborhood)?.name ?? ""
      : "");

  return (
    <div
      className={cn(
        "sticky top-[72px] z-40 border-b lg:top-[80px]",
        isDark
          ? "border-white/10 bg-gradient-to-r from-[#0a1128] via-ustawi-navy to-[#1a2560]"
          : "border-ustawi-border/80 bg-white/95 shadow-sm backdrop-blur-md",
        className,
      )}
    >
      {isDark && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(239,61,50,0.12),transparent_45%)]"
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        {/* Home + location breadcrumb — tap Home to return to landing page */}
        <nav
          aria-label="Search location"
          className="mb-3 flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition",
              isDark
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-ustawi-cream text-ustawi-navy hover:bg-ustawi-navy/10",
            )}
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            <span>Home</span>
          </Link>

          {contextLabel ? (
            <>
              <ChevronRight
                className={cn("h-4 w-4 shrink-0", isDark ? "text-white/40" : "text-ustawi-muted")}
                aria-hidden
              />
              <span
                className={cn(
                  "inline-flex max-w-[min(100%,280px)] items-center truncate rounded-full px-3 py-1.5 font-semibold",
                  isDark ? "bg-ustawi-red/90 text-white" : "bg-ustawi-red/10 text-ustawi-navy",
                )}
                title={contextLabel}
              >
                {contextLabel}
              </span>
            </>
          ) : (
            <>
              <ChevronRight
                className={cn("h-4 w-4 shrink-0", isDark ? "text-white/40" : "text-ustawi-muted")}
                aria-hidden
              />
              <span className={cn("font-medium", isDark ? "text-white/75" : "text-ustawi-muted")}>
                All listings
              </span>
            </>
          )}
        </nav>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className={cn(
                "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2",
                isDark ? "text-ustawi-muted" : "text-ustawi-muted",
              )}
            />
            <Input
              name="q"
              key={inputDefault}
              defaultValue={inputDefault}
              placeholder="Search location, neighborhood, or property…"
              className={cn(
                "h-11 rounded-full pl-12 pr-4 text-sm sm:h-12",
                isDark
                  ? "border-white/20 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                  : "border-ustawi-border bg-white",
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              "h-11 shrink-0 rounded-full px-5 sm:h-12 sm:px-6",
              !isDark && "bg-ustawi-red hover:bg-ustawi-red/90",
            )}
          >
            Search
          </Button>
        </form>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
                  isDark
                    ? "border-white/15 bg-white/10 text-white"
                    : "border-ustawi-border bg-ustawi-cream text-ustawi-navy",
                )}
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => removeChip(chip.paramKeys)}
                  className={cn(
                    "rounded-full p-0.5 transition",
                    isDark
                      ? "text-white/70 hover:bg-white/20 hover:text-white"
                      : "text-ustawi-muted hover:bg-ustawi-navy/10 hover:text-ustawi-navy",
                  )}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
