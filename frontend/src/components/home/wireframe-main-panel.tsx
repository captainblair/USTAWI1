"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Check, MapPin, Shield } from "lucide-react";
import { SAMPLE_PROPERTIES } from "@/lib/assets/sample-properties";
import { formatPrice } from "@/lib/utils";
import type { PropertyListItem } from "@/types/property";
import { WireframeHeroSearch } from "@/components/home/wireframe-hero-search";

const STEPS = [
  { num: "1", label: "Search", desc: "Browse verified listings" },
  { num: "2", label: "View & Compare", desc: "Safety scores & photos" },
  { num: "3", label: "Settle Safely", desc: "Pay with M-Pesa" },
];

function PropertyCard({
  title,
  subtitle,
  price,
  image,
  bedrooms,
  href,
  featured = false,
}: {
  title: string;
  subtitle?: string;
  price: number;
  image: string;
  bedrooms?: number;
  href?: string;
  featured?: boolean;
}) {
  const card = (
    <article
      className={`group overflow-hidden rounded-2xl bg-white transition duration-300 hover:-translate-y-1 ${
        featured
          ? "shadow-[0_12px_40px_rgba(10,17,40,0.12)] ring-1 ring-[#ef2438]/15"
          : "shadow-[0_4px_20px_rgba(10,17,40,0.08)] ring-1 ring-black/[0.04]"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#d4d4d8]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 360px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1128]/60 via-transparent to-transparent" />
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-ustawi-gradient px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-ustawi-red">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ustawi-gradient shadow-ustawi-red ring-2 ring-white/90">
          <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
        </span>
        {bedrooms && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ustawi-navy backdrop-blur-sm">
            <Bed className="h-3.5 w-3.5 text-[#ef2438]" />
            {bedrooms} bed
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ef2438]" />
          <p className="text-sm font-bold text-ustawi-navy">{title}</p>
        </div>
        {subtitle && <p className="text-xs text-ustawi-muted">{subtitle}</p>}
        <p className="pt-1 text-base font-bold text-ustawi-navy">
          {formatPrice(price)}
          <span className="text-sm font-medium text-ustawi-muted">/month</span>
        </p>
      </div>
    </article>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function TrustBadgesFooter() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-8 rounded-2xl bg-gradient-to-r from-[#0a1128] to-[#152d4a] px-6 py-5 sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4CAF50] text-sm font-bold text-white shadow-lg">
          M
        </span>
        <div>
          <p className="text-sm font-bold text-white">M-PESA Payments</p>
          <p className="text-xs text-white/60">Pay rent securely</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ustawi-gradient shadow-ustawi-red">
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">Verified by USTAWI</p>
          <p className="text-xs text-white/60">Every listing checked</p>
        </div>
      </div>
    </div>
  );
}

const MOBILE_FILTERS = ["All", "Nairobi", "Westlands", "Verified"];

function MobilePanel() {
  return (
    <section className="relative z-10 -mt-10 px-4 pb-12 sm:hidden">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(10,17,40,0.15)] ring-1 ring-black/[0.04]">
        <div className="h-1.5 bg-ustawi-gradient" />
        <div className="px-4 pb-6 pt-5">
          <WireframeHeroSearch />
          <div className="mt-3 flex flex-wrap gap-2">
            {MOBILE_FILTERS.map((f, i) => (
              <button
                key={f}
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                  i === 0
                    ? "bg-ustawi-gradient text-white shadow-ustawi-red"
                    : "bg-[#f0f0f4] text-ustawi-navy/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <ul id="testimonials" className="mt-5 space-y-3">
            {SAMPLE_PROPERTIES.map((item) => (
              <li key={item.id}>
                <Link
                  href="/properties"
                  className="flex items-center gap-3 rounded-2xl bg-[#f8f8fa] p-3 ring-1 ring-black/[0.04] transition active:bg-[#f0f0f4]"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-white">
                    <Image src={item.cover} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ustawi-navy">{item.title}</p>
                    <p className="truncate text-xs text-ustawi-muted">{item.subtitle}</p>
                    <p className="truncate text-sm font-semibold text-[#ef2438]">
                      {formatPrice(item.price)}/mo
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ustawi-gradient shadow-ustawi-red">
                    <Shield className="h-3.5 w-3.5 text-white" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-8 w-1 rounded-full bg-ustawi-gradient shadow-ustawi-red" />
      <div>
        <h2 className="text-xl font-extrabold text-ustawi-navy sm:text-2xl">{children}</h2>
        {accent && <p className="text-sm text-ustawi-muted">{accent}</p>}
      </div>
    </div>
  );
}

export function WireframeMainPanel({ featured }: { featured: PropertyListItem[] }) {
  const featuredCards =
    featured.length > 0
      ? featured.slice(0, 3).map((p, i) => ({
          title: p.neighborhood ? `${p.city}, ${p.neighborhood.name}` : p.city,
          subtitle: undefined as string | undefined,
          price: parseFloat(p.price_monthly),
          image: p.primary_image ?? SAMPLE_PROPERTIES[i]?.detail ?? SAMPLE_PROPERTIES[0].detail,
          bedrooms: SAMPLE_PROPERTIES[i]?.bedrooms,
          href: `/properties/${p.slug}`,
        }))
      : SAMPLE_PROPERTIES.map((p) => ({
          title: p.title,
          subtitle: p.subtitle,
          price: p.price,
          image: p.detail,
          bedrooms: p.bedrooms,
          href: "/properties",
        }));

  return (
    <>
      <MobilePanel />

      <section className="relative z-10 -mt-28 hidden px-6 pb-20 sm:block">
        <div className="mx-auto max-w-6xl">
          <div
            id="how-it-works"
            className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(10,17,40,0.14)] ring-1 ring-black/[0.04]"
          >
            <div className="h-1.5 bg-ustawi-gradient" />

            <div className="grid grid-cols-3 gap-4 p-8 pb-0">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8f8fa] to-white p-5 ring-1 ring-black/[0.04] transition hover:shadow-md"
                >
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[#ef2438]/8 transition group-hover:bg-[#ef2438]/12" />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ustawi-gradient text-sm font-bold text-white shadow-ustawi-red">
                    {step.num}
                  </span>
                  <p className="relative mt-3 text-sm font-bold text-ustawi-navy">{step.label}</p>
                  <p className="relative mt-1 text-xs text-ustawi-muted">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8">
              <SectionTitle accent="Discover verified rentals across Nairobi">
                How it works
              </SectionTitle>
              <div className="grid grid-cols-3 gap-5">
                {SAMPLE_PROPERTIES.map((p) => (
                  <PropertyCard
                    key={p.id}
                    title={p.title}
                    subtitle={p.subtitle}
                    price={p.price}
                    image={p.cover}
                    bedrooms={p.bedrooms}
                    href="/properties"
                  />
                ))}
              </div>

              <div className="mt-10">
                <SectionTitle accent="Hand-picked homes with top safety scores">
                  Featured Properties
                </SectionTitle>
                <div className="grid grid-cols-3 gap-5">
                  {featuredCards.map((p) => (
                    <PropertyCard key={p.title + p.price} {...p} featured />
                  ))}
                </div>
              </div>

              <TrustBadgesFooter />
            </div>
          </div>
        </div>
      </section>

      <span id="contact" className="sr-only">
        Contact
      </span>
    </>
  );
}
