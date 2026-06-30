import type { Metadata } from "next";
import { propertyImageSrc } from "@/lib/media-url";
import type { PropertyDetail, PropertyListItem } from "@/types/property";

export const SITE_NAME = "Ustawi";
export const SITE_TAGLINE = "Find Safe Homes in Kenya";
export const DEFAULT_DESCRIPTION =
  "Your trusted platform for secure living in Kenya. Search verified rentals with safety scores and M-Pesa payments.";

const DEFAULT_OG_IMAGE = "/images/houses/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-35-1024x683.jpg";

/** Public site origin — set `NEXT_PUBLIC_SITE_URL` in production (e.g. https://ustawi.co.ke). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

type PageMetadataOptions = {
  title: string;
  description?: string;
  /** Path starting with `/` (e.g. `/properties`). */
  path?: string;
  /** Path or absolute URL for Open Graph / Twitter image. */
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

/** Shared metadata builder for all public (and auth-gated) pages. */
export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = "website",
}: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = absoluteUrl(path || "/");
  const ogImage = absoluteUrl(image);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: canonical,
      locale: "en_KE",
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : { robots: { index: true, follow: true } }),
  };
}

export function createPropertyMetadata(property: PropertyListItem | PropertyDetail, slug: string): Metadata {
  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}`
    : property.city;
  const description =
    "description" in property && property.description
      ? property.description.slice(0, 160)
      : `Verified rental in ${location}. Safety score ${property.safety_score}. From ${property.price_monthly} ${property.currency}/month.`;

  const image = propertyImageSrc(property.primary_image);

  return createPageMetadata({
    title: property.title,
    description,
    path: `/properties/${slug}`,
    image,
    type: "article",
  });
}

export const rootMetadata: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
};
