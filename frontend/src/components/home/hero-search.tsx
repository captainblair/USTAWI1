"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("city", "Nairobi");
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-2xl shadow-black/25 sm:flex-row sm:items-center sm:rounded-2xl"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ustawi-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location or property"
          className="h-14 rounded-xl border-0 bg-transparent pl-12 text-base shadow-none focus:ring-0"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-14 rounded-xl px-10 text-base font-semibold sm:rounded-xl"
      >
        Search
      </Button>
    </form>
  );
}
