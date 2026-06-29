"use client";

import Image from "next/image";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1613490493574-7fde63acd811?w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
];

function CarouselTrack({ images }: { images: string[] }) {
  return (
    <div className="flex w-max animate-hero-marquee gap-4 pr-4">
      {[...images, ...images].map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="relative h-[420px] w-[320px] shrink-0 overflow-hidden rounded-2xl sm:h-[480px] sm:w-[380px]"
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="380px"
            priority={index < 2}
          />
        </div>
      ))}
    </div>
  );
}

export function HeroCarousel() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex items-center opacity-40">
        <CarouselTrack images={HERO_IMAGES} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ustawi-navy/90 via-ustawi-navy/85 to-ustawi-navy/95" />
      <div className="absolute inset-0 bg-ustawi-navy/40" />
    </div>
  );
}
