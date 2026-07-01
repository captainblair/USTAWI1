"use client";

import Image from "next/image";
import { propertyImageSrc } from "@/lib/media-url";
import type { MaintenancePhoto } from "@/types/maintenance";
import { cn } from "@/lib/utils";

type MaintenancePhotoGalleryProps = {
  photos: MaintenancePhoto[];
  className?: string;
};

export function MaintenancePhotoGallery({ photos, className }: MaintenancePhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <p className={cn("text-sm text-ustawi-muted", className)}>No photos attached.</p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3", className)}>
      {photos.map((photo) => {
        const src = propertyImageSrc(photo.image_url);
        return (
          <a
            key={photo.id}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E8EAF2] bg-[#F7F8FC]"
          >
            <Image
              src={src}
              alt={photo.caption || "Maintenance photo"}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 200px"
            />
          </a>
        );
      })}
    </div>
  );
}
