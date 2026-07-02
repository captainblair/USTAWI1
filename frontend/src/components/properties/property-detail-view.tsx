"use client";

import Image from "next/image";
import {
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  Circle,
  Dog,
  FileText,
  Heart,
  Play,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyMiniMapLoader } from "@/components/properties/property-mini-map-loader";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { propertyImageSrc } from "@/lib/media-url";
import { isPropertyOccupied } from "@/lib/properties/status";
import { canSaveProperties } from "@/lib/auth/constants";
import type { PropertyDetail } from "@/types/property";
import { cn } from "@/lib/utils";

type Tab = "overview" | "documents" | "community";

function wireframePrice(amount: string | number, currency = "KES") {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const prefix = currency === "KES" ? "Ksh" : currency;
  return `${prefix} ${Math.round(value).toLocaleString("en-KE")}/month`;
}

function teaserText(description: string, maxLen = 220) {
  const text = description?.trim() || "Modern home in a secure, well-connected neighborhood.";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).replace(/\s+\S*$/, "")}…`;
}

function AmenityRow({ icon: Icon, label }: { icon: typeof BedDouble; label: string }) {
  return (
    <li className="flex items-center gap-3 text-[14px] text-[#1F2B6C]">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#D1D5DB] bg-white">
        <Icon className="h-[15px] w-[15px] text-[#4B5563]" strokeWidth={1.75} />
      </span>
      <span className="leading-snug">{label}</span>
    </li>
  );
}

function amenityIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("pool")) return Waves;
  if (key.includes("park")) return Car;
  if (key.includes("pet")) return Dog;
  if (key.includes("bath") || key.includes("ensuite")) return Bath;
  if (key.includes("bed") || key.includes("room")) return BedDouble;
  if (key.includes("security")) return ShieldCheck;
  return Circle;
}

function ApplyNowButton({
  propertySlug,
  propertyId,
  occupied,
}: {
  propertySlug: string;
  propertyId: string;
  occupied: boolean;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const href = `/properties/${propertySlug}/apply?property=${propertyId}`;
  const loginHref = `/login?next=${encodeURIComponent(href)}`;

  const className =
    "flex h-[46px] w-full items-center justify-center rounded-[10px] bg-[#EF3D32] text-[13px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(239,61,50,0.35)] transition hover:bg-[#e03126] disabled:opacity-60";

  const occupiedClassName =
    "flex h-[46px] w-full cursor-not-allowed items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-[#F1F5F9] text-[13px] font-bold uppercase tracking-[0.14em] text-[#64748B]";

  if (occupied) {
    return (
      <div className="space-y-2">
        <button type="button" className={occupiedClassName} disabled>
          Occupied
        </button>
        <p className="text-center text-[13px] text-[#64748B]">
          This property is currently occupied and not accepting new applications.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <button type="button" className={className} disabled>
        APPLY NOW
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href={loginHref} className={className}>
        APPLY NOW
      </Link>
    );
  }

  if (user?.role !== "TENANT") {
    return (
      <button type="button" className={className} disabled title="Tenants only">
        APPLY NOW
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      APPLY NOW
    </Link>
  );
}

export function PropertyDetailView({ property }: { property: PropertyDetail }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { user, isAuthenticated } = useAuth();

  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}, Kenya`
    : `${property.city}, Kenya`;

  const galleryImages = property.images?.length
    ? property.images.filter((img) => img.image_type !== "FLOOR_PLAN")
    : property.primary_image
      ? [{ id: "primary", image: property.primary_image, caption: property.title }]
      : [];

  const floorPlan = property.images?.find((img) => img.image_type === "FLOOR_PLAN");
  const tourThumb = galleryImages[1]?.image ?? galleryImages[0]?.image ?? property.primary_image;
  const landlordName = property.owner?.full_name || property.landlord_name || "Landlord";
  const landlordInitials =
    landlordName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "L";
  const occupied = isPropertyOccupied(property.status);

  const safetyValue = parseFloat(String(property.safety_score));
  const safetyPercent = Math.min(100, (safetyValue / 10) * 100);

  const amenityRows: { icon: typeof BedDouble; label: string }[] = [
    ...property.amenities.map((a) => ({ icon: amenityIcon(a.name), label: a.name })),
  ];
  if (property.bedrooms >= 1) {
    amenityRows.unshift({ icon: BedDouble, label: "Master Ensuite" });
  }
  if (property.pet_friendly) {
    amenityRows.push({ icon: Dog, label: "Pet Friendly" });
    amenityRows.push({ icon: Dog, label: "Pet Friendly Area" });
  }
  if (property.year_built) amenityRows.push({ icon: Circle, label: `Year Built: ${property.year_built}` });
  amenityRows.push({ icon: Circle, label: `Furnished: ${property.furnished ? "Yes" : "Optional"}` });

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: "Documents" },
    { id: "community", label: "Community Reports" },
  ];

  return (
    <div className="pb-14">
      {/* Gallery on cream */}
      <div className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 sm:pt-8">
        {occupied && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Occupied</span> — this listing is still visible for
            reference, but it is not available for new rental applications.
          </div>
        )}
        <PropertyGallery images={galleryImages} title={property.title} />
      </div>

      {/* White tab bar — full width per wireframe */}
      <div className="mt-6 border-b border-[#E5E7EB] bg-white">
        <nav className="mx-auto flex max-w-[1180px] gap-8 px-5 sm:px-8">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-[3px] py-4 text-[14px] font-semibold transition sm:text-[15px]",
                tab === item.id
                  ? "border-[#1F2B6C] text-[#1F2B6C]"
                  : "border-transparent text-[#6B7280] hover:text-[#1F2B6C]",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        {tab === "overview" && (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.95fr_0.9fr] lg:gap-8 xl:gap-10">
            {/* LEFT */}
            <div>
              <div className="flex flex-wrap items-start gap-2">
                <h1 className="text-[22px] font-bold leading-tight text-[#1F2B6C] sm:text-[24px]">
                  {property.title}
                </h1>
                {property.is_verified && (
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" aria-label="Verified listing" />
                )}
              </div>

              <p className="mt-1.5 text-[14px] text-[#6B7280]">{location}</p>

              <p className="mt-4 text-[18px] font-bold text-[#1F2B6C] sm:text-[19px]">
                {wireframePrice(property.price_monthly, property.currency)}
              </p>

              <p className="mt-4 text-[14px] leading-[1.65] text-[#6B7280]">
                {teaserText(property.description)}
              </p>

              <div className="mt-5">
                <ApplyNowButton propertyId={property.id} propertySlug={property.slug} occupied={occupied} />
              </div>

              <section className="mt-10">
                <h2 className="text-[17px] font-bold text-[#1F2B6C]">Description</h2>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white p-2 shadow-[0_2px_12px_rgba(31,43,108,0.06)]">
                  {floorPlan ? (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={propertyImageSrc(floorPlan.image)}
                        alt="Floor plan"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 440px"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-[#FAFBFD] p-6 text-center">
                      <div className="grid w-full max-w-[280px] grid-cols-3 gap-1 opacity-40">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="aspect-square border border-[#1F2B6C]/30 bg-white" />
                        ))}
                      </div>
                      <p className="text-xs text-[#6B7280]">Floor plan preview</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* MIDDLE */}
            <div>
              <div className="rounded-[14px] border border-[#E8EAF2] bg-white p-5 shadow-[0_2px_16px_rgba(31,43,108,0.06)] sm:p-6">
                <p className="text-[13px] font-semibold text-[#6B7280]">Safety Score</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-[#1F2B6C]">{safetyValue.toFixed(1)}</p>
                <div className="mt-4 h-[9px] overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#86EFAC]"
                    style={{ width: `${safetyPercent}%` }}
                  />
                </div>
                <div className="mt-2.5 flex justify-between text-[11px] font-medium text-[#6B7280]">
                  <span>Neighborhood</span>
                  <span>Property Security</span>
                </div>
              </div>

              <h3 className="mt-7 text-[15px] font-bold text-[#1F2B6C]">Amenities</h3>
              <ul className="mt-4 space-y-[14px]">
                {amenityRows.map((row, i) => (
                  <AmenityRow key={`${row.label}-${i}`} icon={row.icon} label={row.label} />
                ))}
              </ul>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              <div className="rounded-[14px] border border-[#E8EAF2] bg-white p-5 shadow-[0_2px_16px_rgba(31,43,108,0.06)]">
                <div className="flex gap-4">
                  <ProfileAvatar
                    src={property.owner?.avatar}
                    initials={landlordInitials}
                    size="lg"
                    className="ring-[#E8EAF2]"
                  />
                  <div className="min-w-0 pt-1">
                    <p className="text-[15px] font-bold text-[#1F2B6C]">Verified Landlord</p>
                    <p className="truncate text-[13px] text-[#6B7280]">{landlordName}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#059669]">
                      <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                      Online
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 border-t border-[#F3F4F6] pt-4 text-[13px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#6B7280]">Response Rate:</dt>
                    <dd className="font-semibold text-[#1F2B6C]">98%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#6B7280]">On Ustawi since:</dt>
                    <dd className="font-semibold text-[#1F2B6C]">2020</dd>
                  </div>
                </dl>
              </div>

              {property.latitude != null && property.longitude != null && (
                <div className="overflow-hidden rounded-[14px] border border-[#E8EAF2] bg-white shadow-[0_2px_16px_rgba(31,43,108,0.06)]">
                  <PropertyMiniMapLoader
                    latitude={property.latitude}
                    longitude={property.longitude}
                    title={property.title}
                  />
                </div>
              )}

              <div className="overflow-hidden rounded-[14px] border border-[#E8EAF2] bg-white shadow-[0_2px_16px_rgba(31,43,108,0.06)]">
                <p className="border-b border-[#F3F4F6] px-4 py-3 text-[14px] font-bold text-[#1F2B6C]">
                  Virtual Tour
                </p>
                {property.virtual_tour_url ? (
                  <a href={property.virtual_tour_url} target="_blank" rel="noopener noreferrer" className="block">
                    <TourThumbnail image={tourThumb} title={property.title} />
                  </a>
                ) : (
                  <TourThumbnail image={tourThumb} title={property.title} />
                )}
                <p className="py-2.5 text-center text-[12px] font-medium text-[#6B7280]">3D Walkthrough</p>
              </div>

              {isAuthenticated && canSaveProperties(user) && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-[13px] font-semibold text-[#EF3D32] lg:hidden"
                  aria-label="Save property"
                >
                  <Heart className="h-4 w-4" />
                  Save to favorites
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div className="mt-8 max-w-2xl rounded-[14px] border border-[#E8EAF2] bg-white p-6 shadow-[0_2px_16px_rgba(31,43,108,0.06)]">
            <h2 className="text-[17px] font-bold text-[#1F2B6C]">Documents</h2>
            {property.documents && property.documents.length > 0 ? (
              <ul className="mt-5 divide-y divide-[#E5E7EB]">
                {property.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#EF3D32]" />
                      <div>
                        <p className="text-[14px] font-medium text-[#1F2B6C]">{doc.title || doc.doc_type}</p>
                        <p className="text-[12px] capitalize text-[#6B7280]">
                          {doc.doc_type.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-[#EF3D32] hover:underline"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] text-[#6B7280]">No public documents for this listing yet.</p>
            )}
          </div>
        )}

        {tab === "community" && (
          <div className="mt-8 max-w-2xl rounded-[14px] border border-[#E8EAF2] bg-white p-6 shadow-[0_2px_16px_rgba(31,43,108,0.06)]">
            <h2 className="text-[17px] font-bold text-[#1F2B6C]">Community Reports</h2>
            {property.community_reports && property.community_reports.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {property.community_reports.map((report) => (
                  <li key={report.id} className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FC] p-4">
                    <p className="text-[14px] font-semibold text-[#1F2B6C]">{report.title}</p>
                    <p className="mt-1 text-[13px] text-[#6B7280]">{report.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] text-[#6B7280]">No verified community reports for this property.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TourThumbnail({ image, title }: { image: string | null | undefined; title: string }) {
  return (
    <div className="relative aspect-[16/10] bg-[#E8EAF2]">
      <Image
        src={propertyImageSrc(image)}
        alt={`${title} virtual tour`}
        fill
        className="object-cover"
        sizes="320px"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/15">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/95 shadow-md">
          <Play className="ml-0.5 h-6 w-6 fill-[#1F2B6C] text-[#1F2B6C]" />
        </span>
      </span>
    </div>
  );
}
