"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { propertyImageSrc } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  image: string;
  caption?: string;
};

export function PropertyGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displayThumbs = useMemo(() => {
    if (images.length === 0) return [];
    const base = images.slice(0, 5);
    while (base.length < 5 && images.length > 0) {
      base.push(images[base.length % images.length]);
    }
    return base.slice(0, 5);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[2.35/1] items-center justify-center rounded-[14px] bg-[#E8EAF2] text-[#6B7280]">
        No photos yet
      </div>
    );
  }

  const active = images[activeIndex];

  function go(delta: number) {
    setActiveIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="w-full">
      <div className="relative aspect-[2.35/1] overflow-hidden rounded-[14px] bg-[#E8EAF2]">
        <Image
          src={propertyImageSrc(active.image)}
          alt={active.caption || title}
          fill
          className="object-cover"
          sizes="(max-width: 1180px) 100vw, 1180px"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#E5E7EB]/95 text-[#4B5563] shadow-sm transition hover:bg-white sm:left-4 sm:h-10 sm:w-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#E5E7EB]/95 text-[#4B5563] shadow-sm transition hover:bg-white sm:right-4 sm:h-10 sm:w-10"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2.5 sm:mt-5 sm:gap-3">
        {displayThumbs.map((img, index) => {
          const realIndex = images.findIndex((i) => i.id === img.id);
          const thumbIndex = realIndex >= 0 ? realIndex : index % images.length;
          const isActive = thumbIndex === activeIndex;

          return (
            <button
              key={`${img.id}-${index}`}
              type="button"
              onClick={() => setActiveIndex(thumbIndex)}
              className={cn(
                "relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full bg-white sm:h-[52px] sm:w-[52px]",
                isActive ? "ring-[3px] ring-[#EF3D32] ring-offset-2 ring-offset-[#F7F8FC]" : "opacity-85 hover:opacity-100",
              )}
              aria-label={`View photo ${index + 1}`}
            >
              <Image src={propertyImageSrc(img.image)} alt="" fill className="object-cover" sizes="52px" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
