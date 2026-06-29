"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SafetyBadge } from "@/components/properties/safety-badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const examples = [
  {
    title: "Modern Apartment in Kilimani",
    location: "Kilimani, Nairobi",
    price: 85000,
    score: 8.7,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2cd9361?w=800&q=80",
  },
  {
    title: "Family Home in Karen",
    location: "Karen, Nairobi",
    price: 180000,
    score: 9.1,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  },
  {
    title: "Studio in Westlands",
    location: "Westlands, Nairobi",
    price: 45000,
    score: 8.2,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up" className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ustawi-navy sm:text-4xl">
            Browse verified properties with confidence
          </h2>
          <p className="mt-4 text-ustawi-muted">
            Every listing on Ustawi includes safety scores, landlord verification, and transparent pricing.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {examples.map((property, index) => (
            <ScrollReveal
              key={property.title}
              variant={index === 1 ? "scale" : index === 0 ? "slide-left" : "slide-right"}
              delay={index * 0.12}
            >
              <article className="group overflow-hidden rounded-2xl border border-ustawi-border bg-white shadow-md shadow-ustawi-navy/5 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                  <div className="absolute right-3 top-3">
                    <SafetyBadge score={property.score} />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-ustawi-navy">{property.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ustawi-muted">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {property.location}
                  </p>
                  <p className="mt-3 text-xl font-bold text-ustawi-navy">
                    {formatPrice(property.price)}
                    <span className="text-sm font-normal text-ustawi-muted"> /mo</span>
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="fade-up" className="mt-12 text-center">
          <Link href="/properties">
            <Button variant="outline" size="lg" className="gap-2 rounded-2xl">
              Explore all properties
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
