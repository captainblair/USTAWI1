import type { MetadataRoute } from "next";
import { fetchProperties } from "@/lib/api/properties";
import { getSiteUrl } from "@/lib/seo/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const listings = await fetchProperties({ page: "1" });
    propertyPages = listings.results.map((property) => ({
      url: `${siteUrl}/properties/${property.slug}`,
      lastModified: property.published_at ? new Date(property.published_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // API may be offline during build — static routes still emit.
  }

  return [...staticPages, ...propertyPages];
}
