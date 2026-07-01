import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SavePropertyButton } from "@/components/properties/save-property-button";
import { SafetyBadge } from "@/components/properties/safety-badge";
import { propertyImageSrc } from "@/lib/media-url";
import { isPropertyOccupied } from "@/lib/properties/status";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import type { PropertyListItem } from "@/types/property";

function PropertyImage({ property }: { property: PropertyListItem }) {
  const src = propertyImageSrc(property.primary_image);

  return (
    <Image
      src={src}
      alt={property.title}
      fill
      className="property-card-image object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

export function PropertyCard({
  property,
  initialSaved = false,
}: {
  property: PropertyListItem;
  /** When true, heart shows filled until saved-ids query loads. */
  initialSaved?: boolean;
}) {
  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}`
    : property.city;
  const occupied = isPropertyOccupied(property.status);

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ustawi-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-ustawi-navy/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ustawi-sand">
        <PropertyImage property={property} />
        {occupied && <div className="absolute inset-0 bg-[#1F2B6C]/25" aria-hidden />}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {occupied && <Badge variant="occupied">Occupied</Badge>}
          {property.is_verified && <Badge variant="verified">Verified</Badge>}
          {property.is_featured && <Badge variant="featured">Featured</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          <SavePropertyButton propertyId={property.id} initialSaved={initialSaved} size="sm" />
        </div>
        <div className="absolute bottom-3 right-3">
          <SafetyBadge score={property.safety_score} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-red">
              {formatPropertyType(property.property_type)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-ustawi-navy group-hover:text-ustawi-navy-light">
              {property.title}
            </h3>
          </div>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-ustawi-muted">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>

        <div className="mt-4 flex items-center gap-4 text-sm text-ustawi-muted">
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-ustawi-border/60 pt-4">
          <div>
            <p className="text-xl font-bold text-ustawi-navy">
              {formatPrice(property.price_monthly, property.currency)}
            </p>
            <p className="text-xs text-ustawi-muted">{occupied ? "Currently occupied" : "per month"}</p>
          </div>
          <span className="text-sm font-semibold text-ustawi-red opacity-0 transition group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
