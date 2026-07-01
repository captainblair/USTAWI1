"use client";

import { Camera, ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { Button } from "@/components/ui/button";
import {
  deleteLandlordPropertyImage,
  setLandlordPropertyPrimaryImage,
  uploadLandlordPropertyImage,
} from "@/lib/api/landlord-properties";
import { propertyImageSrc } from "@/lib/media-url";
import type { PropertyDetail } from "@/types/property";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

type PropertyImage = PropertyDetail["images"][number];

type LandlordPropertyPhotosProps = {
  propertyId: string;
  accessToken: string;
  images: PropertyImage[];
  title: string;
  onChange: () => Promise<void>;
};

function sortImages(images: PropertyImage[]) {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });
}

export function LandlordPropertyPhotos({
  propertyId,
  accessToken,
  images,
  title,
  onChange,
}: LandlordPropertyPhotosProps) {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const galleryImages = images.filter((img) => img.image_type !== "FLOOR_PLAN");
  const primary = galleryImages.find((img) => img.is_primary) ?? galleryImages[0];
  const secondary = galleryImages.filter((img) => img.id !== primary?.id);

  async function uploadMain(file: File) {
    setBusy("main");
    setError(null);
    try {
      const isFirst = galleryImages.length === 0;
      await uploadLandlordPropertyImage(accessToken, propertyId, file, {
        isPrimary: true,
        sortOrder: 0,
        imageType: "GALLERY",
        caption: isFirst ? "Main photo" : undefined,
      });
      await onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Main photo upload failed.");
    } finally {
      setBusy(null);
      if (mainInputRef.current) mainInputRef.current.value = "";
    }
  }

  async function uploadGalleryFiles(fileList: FileList) {
    setBusy("gallery");
    setError(null);
    try {
      let order = galleryImages.length;
      for (const file of Array.from(fileList)) {
        const isFirst = galleryImages.length === 0 && order === 0;
        await uploadLandlordPropertyImage(accessToken, propertyId, file, {
          isPrimary: isFirst,
          sortOrder: order,
          imageType: "GALLERY",
        });
        order += 1;
      }
      await onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gallery upload failed.");
    } finally {
      setBusy(null);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(imageId);
    setError(null);
    try {
      await setLandlordPropertyPrimaryImage(accessToken, propertyId, imageId);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not set main photo.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(imageId: string) {
    setBusy(imageId);
    setError(null);
    try {
      await deleteLandlordPropertyImage(accessToken, propertyId, imageId);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not delete photo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-ustawi-navy">Photos — how tenants will see them</h3>
        <p className="mt-1 text-sm text-ustawi-muted">
          Upload one <strong>main hero photo</strong> (large image on the listing), then add{" "}
          <strong>gallery photos</strong> (circular thumbnails under the hero — same as seeded listings).
        </p>
      </div>

      {galleryImages.length > 0 && (
        <div className="rounded-xl border border-[#E8EAF2] bg-[#FAFBFE] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Live preview</p>
          <PropertyGallery
            images={galleryImages.map((img) => ({
              id: img.id,
              image: img.image,
              caption: img.caption,
            }))}
            title={title}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main hero upload */}
        <div className="rounded-xl border border-[#E8EAF2] p-4">
          <p className="text-sm font-semibold text-ustawi-navy">Main photo (hero)</p>
          <p className="mt-0.5 text-xs text-ustawi-muted">Wide apartment shot — shown large on the property page.</p>
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-[#E8EAF2]">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={propertyImageSrc(primary.image)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-ustawi-muted">
                <Camera className="h-10 w-10 opacity-40" />
                <span className="mt-2 text-xs">No main photo yet</span>
              </div>
            )}
            {primary && (
              <span className="absolute left-2 top-2 rounded-full bg-ustawi-navy px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Main
              </span>
            )}
          </div>
          <input
            ref={mainInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadMain(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={busy === "main"}
            onClick={() => mainInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {busy === "main" ? "Uploading…" : primary ? "Replace main photo" : "Upload main photo"}
          </Button>
        </div>

        {/* Gallery uploads */}
        <div className="rounded-xl border border-[#E8EAF2] p-4">
          <p className="text-sm font-semibold text-ustawi-navy">Gallery photos (thumbnails)</p>
          <p className="mt-0.5 text-xs text-ustawi-muted">
            Kitchen, bedroom, bathroom, etc. — appear as circles below the hero on the listing.
          </p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void uploadGalleryFiles(e.target.files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={busy === "gallery" || !primary}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {busy === "gallery" ? "Uploading…" : "Add gallery photos"}
          </Button>
          {!primary && (
            <p className="mt-2 text-xs text-amber-700">Upload the main photo first, then add gallery shots.</p>
          )}

          {secondary.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {sortImages(secondary).map((img) => (
                <li key={img.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-lg bg-[#E8EAF2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={propertyImageSrc(img.image)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-1 flex gap-1">
                    <button
                      type="button"
                      title="Set as main photo"
                      disabled={busy === img.id}
                      onClick={() => handleSetPrimary(img.id)}
                      className="flex h-7 flex-1 items-center justify-center rounded border border-[#E8EAF2] text-ustawi-navy hover:bg-ustawi-cream"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      disabled={busy === img.id}
                      onClick={() => handleDelete(img.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {primary && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E8EAF2] bg-white px-4 py-3 text-sm">
          <span className="text-ustawi-muted">All photos ({galleryImages.length}):</span>
          {sortImages(galleryImages).map((img) => (
            <span
              key={img.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                img.is_primary ? "bg-ustawi-navy text-white" : "bg-[#E8EAF2] text-ustawi-navy",
              )}
            >
              {img.is_primary ? "Main" : "Gallery"}
              {!img.is_primary && (
                <button
                  type="button"
                  className="ml-0.5 opacity-70 hover:opacity-100"
                  onClick={() => handleDelete(img.id)}
                  aria-label="Delete"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
