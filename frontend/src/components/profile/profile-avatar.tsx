"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/media-url";

type ProfileAvatarProps = {
  src?: string | null;
  previewSrc?: string | null;
  version?: string | null;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onServerLoad?: () => void;
};

const SIZES = {
  sm: 36,
  md: 48,
  lg: 80,
  xl: 112,
} as const;

/** Renders profile photo at native quality (no Next.js recompression). */
export function ProfileAvatar({
  src,
  previewSrc,
  version,
  initials = "U",
  size = "lg",
  className,
  onServerLoad,
}: ProfileAvatarProps) {
  const px = SIZES[size];
  const [imageError, setImageError] = useState(false);
  const serverSrc = resolveAvatarUrl(src, version);
  const displaySrc = previewSrc ?? (serverSrc && !imageError ? serverSrc : null);

  useEffect(() => {
    setImageError(false);
  }, [src, version, previewSrc]);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-ustawi-navy text-white ring-2 ring-white shadow-sm",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- preserve upload quality; avoid fill/optimizer issues
        <img
          src={displaySrc}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          decoding="async"
          onLoad={() => {
            if (!previewSrc && serverSrc) onServerLoad?.();
          }}
          onError={() => {
            if (previewSrc) return;
            setImageError(true);
          }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold"
          style={{ fontSize: px * 0.34 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
