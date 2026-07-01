import { HomePartners } from "@/components/home/home-partners";
import { OrganizationJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { HomeFaq } from "@/components/home/home-faq";
import { HomeAppPromo } from "@/components/home/home-app-promo";
import { HomeContact, HomeTestimonials } from "@/components/home/home-sections";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeNeighborhoods } from "@/components/home/home-neighborhoods";
import { LandlordCta } from "@/components/home/landlord-cta";
import { TrustPillars } from "@/components/home/trust-pillars";
import { WireframeHero } from "@/components/home/wireframe-hero";
import { WireframeMainPanel } from "@/components/home/wireframe-main-panel";
import { WireframeNav } from "@/components/home/wireframe-nav";
import {
  fetchFeaturedProperties,
  fetchFilterMetadata,
  fetchProperties,
} from "@/lib/api/properties";
import type { FilterMetadata, PropertyListItem } from "@/types/property";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Find Safe Homes in Kenya",
  description:
    "Search verified rental properties in Nairobi with safety scores, neighborhood insights, and secure M-Pesa rent payments.",
  path: "/",
});

async function loadHomePageData() {
  const [featuredResult, filtersResult, listingsResult] = await Promise.allSettled([
    fetchFeaturedProperties(),
    fetchFilterMetadata(),
    fetchProperties({ page: "1" }),
  ]);

  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : [];
  const filters = filtersResult.status === "fulfilled" ? filtersResult.value : null;
  const listings =
    listingsResult.status === "fulfilled" ? listingsResult.value.results : [];
  const propertyCount =
    listingsResult.status === "fulfilled" ? listingsResult.value.count : 0;

  const safety = filters?.safety_score_range;
  const avgSafety =
    safety && safety.max > 0
      ? ((safety.min + safety.max) / 2).toFixed(1)
      : "8.5";

  return {
    featured,
    listings,
    filters,
    propertyCount,
    avgSafety,
    neighborhoodCount: filters?.neighborhoods?.length ?? 0,
  };
}

export default async function HomePage() {
  const data = await loadHomePageData();

  return (
    <div className="min-h-screen bg-ustawi-cream" data-scroll-tone="navy">
      <OrganizationJsonLd />
      <div className="relative">
        <WireframeNav />
        <WireframeHero
          stats={{
            propertyCount: data.propertyCount,
            avgSafety: data.avgSafety,
            neighborhoodCount: data.neighborhoodCount,
          }}
        />
        <WireframeMainPanel featured={data.featured} listings={data.listings} />
      </div>
      <HomeNeighborhoods
        neighborhoods={data.filters?.neighborhoods ?? []}
        cities={data.filters?.cities ?? []}
      />
      <TrustPillars />
      <HomeTestimonials />
      <LandlordCta />
      <HomePartners />
      <HomeFaq />
      <HomeAppPromo />
      <HomeContact />
      <HomeFooter />
    </div>
  );
}
