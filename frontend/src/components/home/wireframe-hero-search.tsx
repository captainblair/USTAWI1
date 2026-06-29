"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
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

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto flex w-full max-w-2xl flex-col gap-3 sm:max-w-3xl sm:flex-row sm:items-stretch sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:bg-white sm:shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${className ?? ""}`}
    >
      <div className="relative flex flex-1 items-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:rounded-none sm:shadow-none">
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-ustawi-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location, neighborhood, or property..."
          className="h-[54px] w-full bg-transparent pl-12 pr-4 text-sm text-ustawi-navy placeholder:text-ustawi-muted focus:outline-none sm:h-[56px]"
        />
      </div>
      <Button
        type="submit"
        className="h-[54px] shrink-0 rounded-2xl px-8 text-sm font-bold shadow-ustawi-red sm:h-[56px] sm:rounded-none sm:rounded-r-2xl"
      >
        Search
      </Button>
    </form>
  );
}
