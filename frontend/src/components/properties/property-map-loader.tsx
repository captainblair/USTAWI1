"use client";

import dynamic from "next/dynamic";

export const PropertyMap = dynamic(
  () => import("@/components/properties/property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-2xl border border-ustawi-border bg-ustawi-sand sm:h-[380px] lg:h-[420px]" />
    ),
  },
);
