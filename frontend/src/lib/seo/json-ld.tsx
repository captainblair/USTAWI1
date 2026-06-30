import { absoluteUrl } from "@/lib/seo/metadata";
import type { PropertyDetail, PropertyListItem } from "@/types/property";

type PropertyListingJsonLdProps = {
  property: PropertyListItem | PropertyDetail;
  slug: string;
};

/** Schema.org RealEstateListing for property detail pages. */
export function PropertyListingJsonLd({ property, slug }: PropertyListingJsonLdProps) {
  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}`
    : property.city;

  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description:
      "description" in property && property.description
        ? property.description.slice(0, 500)
        : `Verified rental in ${location}.`,
    url: absoluteUrl(`/properties/${slug}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressCountry: "KE",
    },
    ...(property.latitude != null && property.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: property.price_monthly,
      priceCurrency: property.currency ?? "KES",
      availability: "https://schema.org/InStock",
    },
    numberOfRooms: property.bedrooms,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite schema for the homepage. */
export function OrganizationJsonLd() {
  const siteUrl = absoluteUrl("/");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Ustawi",
        url: siteUrl,
        logo: absoluteUrl("/images/logo/best.png"),
        areaServed: { "@type": "Country", name: "Kenya" },
      },
      {
        "@type": "WebSite",
        name: "Ustawi",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/properties?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
