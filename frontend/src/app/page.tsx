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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f8fa] to-white">
      <div className="relative">
        <WireframeNav />
        <WireframeHero />
        <WireframeMainPanel featured={featured} />
      </div>
    </div>
  );
}
