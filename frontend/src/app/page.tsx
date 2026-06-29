import { HomeAppPromo } from "@/components/home/home-app-promo";
import { HomeContact, HomeTestimonials } from "@/components/home/home-sections";
import { WireframeHero } from "@/components/home/wireframe-hero";
import { WireframeMainPanel } from "@/components/home/wireframe-main-panel";
import { WireframeNav } from "@/components/home/wireframe-nav";
import { fetchFeaturedProperties } from "@/lib/api/properties";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof fetchFeaturedProperties>> = [];
  try {
    featured = await fetchFeaturedProperties();
  } catch {
    featured = [];
  }

  return (
    <div className="min-h-screen bg-ustawi-cream">
      <div className="relative">
        <WireframeNav />
        <WireframeHero />
        <WireframeMainPanel featured={featured} />
      </div>
      <HomeTestimonials />
      <HomeAppPromo />
      <HomeContact />
    </div>
  );
}
