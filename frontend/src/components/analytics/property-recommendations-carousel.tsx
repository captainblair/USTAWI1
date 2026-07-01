"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { PropertyCard } from "@/components/properties/property-card";
import type { PropertyListItem } from "@/types/property";

export function PropertyRecommendationsCarousel({ properties }: { properties: PropertyListItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (properties.length === 0) {
    return (
      <p className="text-sm text-ustawi-muted">
        Save or apply to properties to get personalized recommendations.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="rounded-full border border-[#E8EAF2] bg-white p-2 shadow-sm hover:bg-ustawi-cream"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-ustawi-navy" />
        </button>
      </div>
      <div className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
        <button
          type="button"
          onClick={() => scroll("right")}
          className="rounded-full border border-[#E8EAF2] bg-white p-2 shadow-sm hover:bg-ustawi-cream"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-ustawi-navy" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 scrollbar-thin"
      >
        {properties.map((property) => (
          <div key={property.id} className="w-[min(100%,280px)] shrink-0 snap-start sm:w-[300px]">
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </div>
  );
}
