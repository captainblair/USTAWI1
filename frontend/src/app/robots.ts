import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/saved", "/api-backend/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
