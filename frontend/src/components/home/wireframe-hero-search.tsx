"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Map, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WireframeHeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("city", "Nairobi");
    router.push(`/properties?${params.toString()}`);
  }

  function openMapSearch() {
    router.push("/properties?city=Nairobi");
  }

  return (
    <div className={`mx-auto w-full max-w-2xl sm:max-w-3xl ${className ?? ""}`}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:bg-white sm:shadow-[0_16px_48px_rgba(31,43,108,0.18)]"
      >
        <div className="relative flex flex-1 items-center overflow-hidden rounded-xl bg-white shadow-[0_8px_32px_rgba(31,43,108,0.12)] sm:rounded-none sm:shadow-none">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-ustawi-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location, neighborhood, or property..."
            className="h-[52px] w-full bg-transparent pl-12 pr-4 text-sm font-normal text-ustawi-navy placeholder:text-ustawi-muted focus:outline-none sm:h-[54px]"
          />
        </div>
        <Button
          type="submit"
          className="h-[52px] shrink-0 rounded-xl px-8 text-sm sm:h-[54px] sm:rounded-none sm:rounded-r-xl"
        >
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={openMapSearch}
          className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <Map className="h-4 w-4" />
          Browse on map
        </Button>
        <Link
          href="/properties?city=Nairobi"
          className="text-sm font-medium text-white/75 underline-offset-4 transition hover:text-white hover:underline"
        >
          View all listings
        </Link>
      </div>
    </div>
  );
}
