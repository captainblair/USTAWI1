"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { PropertyListItem } from "@/types/property";

const PropertyMapInner = dynamic(
  () => import("@/components/properties/property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

function MapSkeleton() {
  return (
    <div className="h-[320px] animate-pulse rounded-2xl border border-ustawi-border bg-ustawi-sand sm:h-[380px] lg:h-[420px]" />
  );
}

type PropertyMapProps = {
  properties: PropertyListItem[];
  className?: string;
};

export function PropertyMap(props: PropertyMapProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <PropertyMapInner {...props} />
    </Suspense>
  );
}
