"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bed, Check, MapPin, Shield } from "lucide-react";
import { SAMPLE_PROPERTIES } from "@/lib/assets/sample-properties";
import { propertyImageSrc } from "@/lib/media-url";
import { formatPrice } from "@/lib/utils";
import type { PropertyListItem } from "@/types/property";
import { SafetyBadge } from "@/components/properties/safety-badge";
import { WireframeHeroSearch } from "@/components/home/wireframe-hero-search";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { Button } from "@/components/ui/button";

const STEPS = [
  { num: "1", label: "Search", desc: "Browse verified listings" },
  { num: "2", label: "View & Compare", desc: "Safety scores & photos" },
  { num: "3", label: "Settle Safely", desc: "Pay with M-Pesa" },
];

type CardData = {
  title: string;
  subtitle?: string;
  price: number;
  image: string;
  bedrooms?: number;
  href?: string;
  featured?: boolean;
  safetyScore?: number;
};

function mapProperty(p: PropertyListItem, fallbackImage: string, index: number): CardData {
  return {
    title: p.title,
    subtitle: p.neighborhood ? `${p.neighborhood.name}, ${p.city}` : p.city,
    price: parseFloat(p.price_monthly),
    image: propertyImageSrc(p.primary_image, fallbackImage),
    bedrooms: p.bedrooms,
    href: `/properties/${p.slug}`,
    safetyScore: parseFloat(p.safety_score),
    featured: p.is_featured,
  };
}

function PropertyCard({
  title,
  subtitle,
  price,
  image,
  bedrooms,
  href,
  featured = false,
  safetyScore,
}: CardData) {
  const card = (
    <article
      className={`group overflow-hidden rounded-2xl bg-white transition duration-300 hover:-translate-y-1 ${
        featured
          ? "shadow-soft ring-1 ring-ustawi-red/15"
          : "shadow-soft ring-1 ring-ustawi-border/60"
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
        <div className="absolute inset-0 bg-gradient-to-t from-ustawi-navy/60 via-transparent to-transparent" />
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-ustawi-red px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-ustawi-red">
            Featured
          </span>
        )}
        {safetyScore != null && !Number.isNaN(safetyScore) && (
          <div className="absolute right-3 top-3">
            <SafetyBadge score={safetyScore} size="sm" />
          </div>
        )}
        {!safetyScore && (
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ustawi-red shadow-ustawi-red ring-2 ring-white/90">
            <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
        )}
        {bedrooms != null && bedrooms > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ustawi-navy backdrop-blur-sm">
            <Bed className="h-3.5 w-3.5 text-ustawi-red" />
            {bedrooms} bed
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ustawi-red" />
          <p className="line-clamp-2 text-sm font-semibold text-ustawi-navy">{title}</p>
        </div>
        {subtitle && <p className="text-xs text-ustawi-muted">{subtitle}</p>}
        <p className="pt-1 text-base font-semibold text-ustawi-navy">
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
    <div className="mt-10 flex flex-wrap items-center justify-center gap-8 rounded-2xl bg-ustawi-navy px-6 py-5 sm:justify-between">
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
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ustawi-red shadow-ustawi-red">
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

function MobilePanel({ listings }: { listings: CardData[] }) {
  const items = listings.length > 0 ? listings : SAMPLE_PROPERTIES.map((p) => ({
    title: p.title,
    subtitle: p.subtitle,
    price: p.price,
    image: p.cover,
    bedrooms: p.bedrooms,
    href: "/properties",
  }));

  return (
    <section data-scroll-tone="navy" className="relative z-10 -mt-10 px-4 pb-12 sm:hidden">
      <ScrollReveal variant="fade-up">
        <div className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ustawi-border/60">
          <div className="h-1 bg-ustawi-red" />
          <div className="px-4 pb-6 pt-5">
            <WireframeHeroSearch />
            <div className="mt-3 flex flex-wrap gap-2">
              {MOBILE_FILTERS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    i === 0
                      ? "bg-ustawi-red text-white shadow-ustawi-red"
                      : "bg-ustawi-cream text-ustawi-navy/80"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {items.slice(0, 3).map((item, i) => (
                <ScrollReveal key={item.title + i} variant="slide-right" delay={i * 0.08}>
                  <li>
                    <Link
                      href={item.href ?? "/properties"}
                      className="flex items-center gap-3 rounded-2xl bg-[#f8f8fa] p-3 ring-1 ring-black/[0.04] transition active:bg-[#f0f0f4]"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-white">
                        <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ustawi-navy">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-ustawi-muted">{item.subtitle}</p>
                        )}
                        <p className="truncate text-sm font-semibold text-ustawi-red">
                          {formatPrice(item.price)}/mo
                        </p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ustawi-red shadow-ustawi-red">
                        <Shield className="h-3.5 w-3.5 text-white" />
                      </span>
                    </Link>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function SectionTitle({
  children,
  accent,
  action,
}: {
  children: React.ReactNode;
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 rounded-full bg-ustawi-red" />
        <div>
          <h2 className="text-xl font-semibold text-ustawi-navy sm:text-2xl">{children}</h2>
          {accent && <p className="text-sm text-ustawi-muted">{accent}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function WireframeMainPanel({
  featured,
  listings = [],
}: {
  featured: PropertyListItem[];
  listings?: PropertyListItem[];
}) {
  const sampleCards: CardData[] = SAMPLE_PROPERTIES.map((p) => ({
    title: p.title,
    subtitle: p.subtitle,
    price: p.price,
    image: p.cover,
    bedrooms: p.bedrooms,
    href: "/properties",
  }));

  const apiBrowse =
    listings.length >= 3
      ? listings.slice(0, 3).map((p, i) => mapProperty(p, SAMPLE_PROPERTIES[i]?.cover ?? SAMPLE_PROPERTIES[0].cover, i))
      : featured.length >= 3
        ? featured.slice(0, 3).map((p, i) => mapProperty(p, SAMPLE_PROPERTIES[i]?.cover ?? SAMPLE_PROPERTIES[0].cover, i))
        : null;

  const browseCards = apiBrowse ?? sampleCards;

  const featuredCards =
    featured.length > 0
      ? featured.slice(0, 3).map((p, i) => ({
          ...mapProperty(p, SAMPLE_PROPERTIES[i]?.detail ?? SAMPLE_PROPERTIES[0].detail, i),
          featured: true,
        }))
      : listings.length > 0
        ? listings.slice(0, 3).map((p, i) => ({
            ...mapProperty(p, SAMPLE_PROPERTIES[i]?.detail ?? SAMPLE_PROPERTIES[0].detail, i),
            featured: true,
          }))
        : sampleCards.map((p) => ({ ...p, image: SAMPLE_PROPERTIES.find((s) => s.title === p.title)?.detail ?? p.image, featured: true }));

  return (
    <>
      <MobilePanel listings={browseCards} />

      <section data-scroll-tone="navy" className="relative z-10 -mt-28 hidden px-6 pb-20 sm:block">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <div
              id="how-it-works"
              className="scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ustawi-border/60"
            >
              <div className="h-1 bg-ustawi-red" />

              <div className="grid grid-cols-3 gap-4 p-8 pb-0">
                {STEPS.map((step, i) => (
                  <ScrollReveal key={step.num} variant="fade-up" delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-xl border border-ustawi-border/60 bg-ustawi-cream p-5 transition hover:border-ustawi-red/20 hover:shadow-soft">
                      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-ustawi-coral-light transition group-hover:bg-ustawi-coral-light/80" />
                      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-ustawi-red text-sm font-semibold text-white shadow-ustawi-red">
                        {step.num}
                      </span>
                      <p className="relative mt-3 text-sm font-semibold text-ustawi-navy">{step.label}</p>
                      <p className="relative mt-1 text-xs text-ustawi-muted">{step.desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="p-8">
                <ScrollReveal variant="fade-up">
                  <SectionTitle
                    accent="Live listings from our verified catalogue"
                    action={
                      <Link href="/properties">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          View all
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    }
                  >
                    How it works
                  </SectionTitle>
                </ScrollReveal>
                <div className="grid grid-cols-3 gap-5">
                  {browseCards.map((p, i) => (
                    <ScrollReveal key={p.title + p.price + i} variant="fade-up" delay={i * 0.12}>
                      <PropertyCard {...p} />
                    </ScrollReveal>
                  ))}
                </div>

                <div id="featured-properties" className="mt-10 scroll-mt-28">
                  <ScrollReveal variant="fade-up">
                    <SectionTitle
                      accent="Hand-picked homes with top safety scores"
                      action={
                        <Link href="/properties?ordering=-is_featured">
                          <Button variant="outline" size="sm" className="gap-1.5">
                            See featured
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      }
                    >
                      Featured Properties
                    </SectionTitle>
                  </ScrollReveal>
                  <div className="grid grid-cols-3 gap-5">
                    {featuredCards.map((p, i) => (
                      <ScrollReveal key={p.title + p.price + i} variant="fade-up" delay={i * 0.12}>
                        <PropertyCard {...p} featured />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>

                <ScrollReveal variant="fade-up" delay={0.15}>
                  <TrustBadgesFooter />
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
