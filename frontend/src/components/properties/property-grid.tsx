import { SearchX } from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/types/property";

export function PropertyGrid({
  properties,
  count,
}: {
  properties: PropertyListItem[];
  count: number;
}) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ustawi-border bg-white px-8 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ustawi-sand text-ustawi-navy">
          <SearchX className="h-8 w-8" />
        </span>
        <h3 className="mt-6 text-xl font-bold text-ustawi-navy">No homes match your search</h3>
        <p className="mt-2 max-w-md text-ustawi-muted">
          Try adjusting your price range, lowering the safety score filter, or exploring nearby
          neighborhoods.
        </p>
        <Link href="/properties" className="mt-8">
          <Button variant="outline">Clear all filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-ustawi-muted">
        <span className="font-semibold text-ustawi-navy">{count}</span> verified{" "}
        {count === 1 ? "home" : "homes"} found
      </p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
