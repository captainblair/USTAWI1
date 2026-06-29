import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SafetyBadge } from "@/components/properties/safety-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPropertyDetail } from "@/lib/api/properties";
import { formatPrice, formatPropertyType } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const property = await fetchPropertyDetail(slug);
    return { title: `${property.title} — Ustawi`, description: property.description?.slice(0, 160) };
  } catch {
    return { title: "Property — Ustawi" };
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let property;
  try {
    property = await fetchPropertyDetail(slug);
  } catch {
    notFound();
  }

  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}`
    : property.city;

  const gallery = property.images?.length
    ? property.images
    : property.primary_image
      ? [{ id: "primary", image: property.primary_image, caption: "", is_primary: true }]
      : [];

  return (
    <div className="bg-ustawi-cream pb-16">
      <div className="border-b border-ustawi-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-sm font-medium text-ustawi-muted transition hover:text-ustawi-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Gallery */}
        <div className="mt-8 grid gap-3 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
          {gallery.length > 0 ? (
            gallery.slice(0, 5).map((img, index) => (
              <div
                key={img.id}
                className={`relative overflow-hidden bg-ustawi-sand ${
                  index === 0 ? "sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto sm:min-h-[360px]" : "aspect-[4/3]"
                }`}
              >
                <Image src={img.image} alt={img.caption || property.title} fill className="object-cover" sizes="50vw" />
              </div>
            ))
          ) : (
            <div className="col-span-full flex aspect-[21/9] items-center justify-center bg-gradient-to-br from-ustawi-navy to-ustawi-navy-light text-white/60">
              No photos yet
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {property.is_verified && <Badge variant="verified">Verified listing</Badge>}
              {property.is_featured && <Badge variant="featured">Featured</Badge>}
              <Badge>{formatPropertyType(property.property_type)}</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-bold text-ustawi-navy sm:text-4xl">{property.title}</h1>
            <p className="mt-2 flex items-center gap-2 text-ustawi-muted">
              <MapPin className="h-4 w-4" />
              {location}
            </p>

            <div className="mt-6 flex flex-wrap gap-6 text-ustawi-navy">
              <span className="flex items-center gap-2 font-medium">
                <BedDouble className="h-5 w-5 text-ustawi-muted" />
                {property.bedrooms} bedrooms
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Bath className="h-5 w-5 text-ustawi-muted" />
                {property.bathrooms} bathrooms
              </span>
              <SafetyBadge score={property.safety_score} size="lg" />
            </div>

            <div className="mt-10 rounded-2xl border border-ustawi-border bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-ustawi-navy">About this home</h2>
              <p className="mt-4 leading-relaxed text-ustawi-muted whitespace-pre-line">
                {property.description || "No description provided yet."}
              </p>
            </div>

            {property.amenities.length > 0 && (
              <div className="mt-6 rounded-2xl border border-ustawi-border bg-white p-6 sm:p-8">
                <h2 className="text-lg font-bold text-ustawi-navy">Amenities</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {property.amenities.map((amenity) => (
                    <li key={amenity.id} className="flex items-center gap-2 text-sm text-ustawi-muted">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-ustawi-success" />
                      {amenity.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar — apply card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-lg shadow-ustawi-navy/5">
              <p className="text-3xl font-bold text-ustawi-navy">
                {formatPrice(property.price_monthly, property.currency)}
              </p>
              <p className="text-sm text-ustawi-muted">per month</p>

              <Link href="/login" className="mt-6 block">
                <Button size="lg" className="w-full">
                  Apply for this home
                </Button>
              </Link>
              <p className="mt-3 text-center text-xs text-ustawi-muted">
                Log in or register to submit an application
              </p>

              <div className="mt-8 border-t border-ustawi-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Landlord</p>
                <p className="mt-2 font-semibold text-ustawi-navy">
                  {property.owner?.full_name || property.landlord_name}
                </p>
                {property.owner?.is_verified_landlord && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-ustawi-success">
                    <ShieldCheck className="h-4 w-4" />
                    Verified landlord
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
