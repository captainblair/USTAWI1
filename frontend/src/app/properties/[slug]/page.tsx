import { PropertyDetailShell } from "@/components/properties/property-detail-shell";
import { PropertyDetailView } from "@/components/properties/property-detail-view";
import { PropertyListingJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata, createPropertyMetadata } from "@/lib/seo/metadata";
import { getServerAccessToken } from "@/lib/auth/server";
import { fetchPropertyDetail } from "@/lib/api/properties";
import Link from "next/link";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const property = await fetchPropertyDetail(slug);
    return createPropertyMetadata(property, slug);
  } catch {
    return createPageMetadata({ title: "Property", path: `/properties/${slug}` });
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const token = await getServerAccessToken();

  let property;
  let loadError: string | null = null;
  try {
    property = await fetchPropertyDetail(slug, token);
  } catch {
    loadError = "Could not load this listing. Please try again in a few minutes.";
  }

  if (!property) {
    return (
      <PropertyDetailShell>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-ustawi-border bg-white p-10 text-center shadow-soft">
            <h1 className="text-2xl font-bold text-ustawi-navy">Listing unavailable</h1>
            <p className="mt-3 text-sm text-ustawi-muted">
              {loadError ?? "This property may have been removed or is no longer active."}
            </p>
            <Link
              href="/properties"
              className="mt-6 inline-flex rounded-xl bg-ustawi-red px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white"
            >
              Back to search
            </Link>
          </div>
        </div>
      </PropertyDetailShell>
    );
  }

  return (
    <PropertyDetailShell>
      <PropertyListingJsonLd property={property} slug={slug} />
      <PropertyDetailView property={property} />
    </PropertyDetailShell>
  );
}
