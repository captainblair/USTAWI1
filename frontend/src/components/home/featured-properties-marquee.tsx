"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { propertyImageSrc } from "@/lib/media-url";
import type { PropertyListItem } from "@/types/property";

type SlideItem = {
  src: string;
  href: string;
  title: string;
  subtitle: string;
};

const HOLD_MS = 1100;
const ENTER_DURATION = 0.48;
const EXIT_DURATION = 0.32;

const easeEnter = [0.16, 1, 0.3, 1] as const;
const easeExit = [0.4, 0, 0.9, 0.6] as const;

function slideVariants(fromRight: boolean) {
  const offset = "105%";
  return {
    initial: {
      x: fromRight ? offset : `-${offset}`,
      opacity: 0,
      scale: 1.04,
      filter: "blur(6px)",
    },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: ENTER_DURATION, ease: easeEnter },
    },
    exit: {
      x: fromRight ? `-${offset}` : offset,
      opacity: 0,
      scale: 0.98,
      filter: "blur(4px)",
      transition: { duration: EXIT_DURATION, ease: easeExit },
    },
  };
}

function ProgressBar({ durationMs }: { durationMs: number }) {
  return (
    <div className="h-0.5 overflow-hidden rounded-full bg-ustawi-border/80">
      <motion.div
        className="h-full origin-left rounded-full bg-ustawi-red"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: durationMs / 1000, ease: "linear" }}
      />
    </div>
  );
}

export function FeaturedPropertiesMarquee({ featured }: { featured: PropertyListItem[] }) {
  const items = useMemo<SlideItem[]>(
    () =>
      featured
        .filter((p) => p.primary_image)
        .map((p) => ({
          src: propertyImageSrc(p.primary_image),
          href: `/properties/${p.slug}`,
          title: p.title,
          subtitle: p.neighborhood ? `${p.neighborhood.name}, ${p.city}` : p.city,
        })),
    [featured],
  );

  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const count = items.length;

  const advance = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev + 1) % count);
    setProgressKey((k) => k + 1);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(advance, HOLD_MS + (ENTER_DURATION + EXIT_DURATION) * 1000);
    return () => window.clearInterval(timer);
  }, [advance, count]);

  if (count === 0) {
    return null;
  }

  const current = items[index];
  const fromRight = index % 2 === 1;
  const cycleMs = HOLD_MS + (ENTER_DURATION + EXIT_DURATION) * 1000;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-ustawi-navy/5 ring-1 ring-ustawi-border/50">
      <div className="relative aspect-[16/7] w-full overflow-hidden sm:aspect-[16/6]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${current.href}-${index}`}
            variants={slideVariants(fromRight)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <Link href={current.href} className="group relative block h-full w-full">
              <Image
                src={current.src}
                alt={current.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 1152px"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ustawi-navy/85 via-ustawi-navy/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Featured
                  </p>
                  <p className="mt-1 line-clamp-1 text-base font-bold text-white sm:text-lg">
                    {current.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-white/75 sm:text-sm">{current.subtitle}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ustawi-red shadow-ustawi-red ring-2 ring-white/90 transition group-hover:scale-105">
                  <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="space-y-2 px-4 pb-4 pt-3">
          <ProgressBar key={progressKey} durationMs={cycleMs} />
          <div className="flex items-center justify-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.href}
                type="button"
                aria-label={`Show ${item.title}`}
                onClick={() => {
                  setIndex(i);
                  setProgressKey((k) => k + 1);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-ustawi-red" : "w-1.5 bg-ustawi-border hover:bg-ustawi-muted/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
