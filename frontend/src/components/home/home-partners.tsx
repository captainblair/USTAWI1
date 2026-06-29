"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { PARTNERS } from "@/lib/assets/partners";
import { cn } from "@/lib/utils";

function PartnerLogo({ name, logo, href }: (typeof PARTNERS)[number]) {
  const image = (
    <Image
      src={logo}
      alt={name}
      width={240}
      height={96}
      className="h-16 w-auto max-w-[220px] object-contain object-center transition-all duration-300 ease-out sm:h-20"
    />
  );

  const wrapperClass = cn(
    "group flex h-28 items-center justify-center rounded-xl px-8 py-4 sm:h-32 sm:px-10",
    "[&_img]:grayscale [&_img]:contrast-125",
    "hover:[&_img]:grayscale-0 hover:[&_img]:contrast-100",
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
        aria-label={name}
      >
        {image}
      </Link>
    );
  }

  return <div className={wrapperClass}>{image}</div>;
}

export function HomePartners() {
  return (
    <section
      data-scroll-tone="navy"
      id="partners"
      className="scroll-mt-24 border-t border-ustawi-border/60 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal variant="fade-up">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-ustawi-navy sm:text-3xl">Our Partners</h2>
            <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-ustawi-red" aria-hidden />
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
            {PARTNERS.map((partner) => (
              <PartnerLogo key={partner.name} {...partner} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
