"use client";

import NextTopLoader from "nextjs-toploader";

/**
 * Thin top progress bar during App Router navigations (Link clicks, router.push, back/forward).
 * Mimics the native mobile browser loading indicator on all screen sizes.
 */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="#EF3D32"
      height={3}
      showSpinner={false}
      crawl
      crawlSpeed={180}
      speed={280}
      easing="ease"
      shadow="0 0 12px rgba(239,61,50,0.45)"
      zIndex={1600}
      showAtBottom={false}
    />
  );
}
