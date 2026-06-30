"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { FilterMetadata } from "@/types/property";

export function PropertyFilters({ metadata }: { metadata: FilterMetadata }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/properties?${params.toString()}`));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    const filterKeys = [
      "q",
      "city",
      "neighborhood",
      "min_price",
      "max_price",
      "min_beds",
      "max_beds",
      "min_baths",
      "property_type",
      "min_safety_score",
      "amenities",
      "ordering",
    ] as const;

    filterKeys.forEach((key) => {
      const value = form.get(key);
      if (value) params.set(key, String(value));
      else params.delete(key);
    });

    params.delete("page");
    startTransition(() => router.push(`/properties?${params.toString()}`));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-ustawi-navy">
        <SlidersHorizontal className="h-5 w-5" />
        <h2 className="font-bold">Filters</h2>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
          Keyword
        </label>
        <Input name="q" defaultValue={searchParams.get("q") ?? ""} placeholder="Search…" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
          City
        </label>
        <Select name="city" defaultValue={searchParams.get("city") ?? ""}>
          <option value="">All cities</option>
          {metadata.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
          Neighborhood
        </label>
        <Select name="neighborhood" defaultValue={searchParams.get("neighborhood") ?? ""}>
          <option value="">All neighborhoods</option>
          {metadata.neighborhoods.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
            Min price
          </label>
          <Input
            name="min_price"
            type="number"
            defaultValue={searchParams.get("min_price") ?? ""}
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
            Max price
          </label>
          <Input
            name="max_price"
            type="number"
            defaultValue={searchParams.get("max_price") ?? ""}
            placeholder="200000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
            Min beds
          </label>
          <Input name="min_beds" type="number" defaultValue={searchParams.get("min_beds") ?? ""} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
            Min safety
          </label>
          <Input
            name="min_safety_score"
            type="number"
            step="0.1"
            defaultValue={searchParams.get("min_safety_score") ?? ""}
            placeholder="7"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
          Property type
        </label>
        <Select name="property_type" defaultValue={searchParams.get("property_type") ?? ""}>
          <option value="">All types</option>
          {metadata.property_types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
          Sort by
        </label>
        <Select
          name="ordering"
          defaultValue={searchParams.get("ordering") ?? "-safety_score"}
          onChange={(e) => updateParams("ordering", e.target.value)}
        >
          <option value="-safety_score">Safety score (high)</option>
          <option value="price">Price (low)</option>
          <option value="-price">Price (high)</option>
          <option value="-created_at">Newest</option>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Searching…" : "Apply filters"}
      </Button>
    </form>
  );
}
