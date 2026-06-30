"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const PropertyMiniMapInner = dynamic(
  () => import("@/components/properties/property-mini-map").then((m) => m.PropertyMiniMap),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-xl bg-ustawi-sand" /> },
);

type Props = {
  latitude: number;
  longitude: number;
  title: string;
};

export function PropertyMiniMapLoader(props: Props) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-ustawi-sand" />}>
      <PropertyMiniMapInner {...props} />
    </Suspense>
  );
}
