"use client";

import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/media-url";

type ProfileAvatarProps = {
  src?: string | null;
  previewSrc?: string | null;
  version?: string | null;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
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
}: ProfileAvatarProps) {
  const px = SIZES[size];
  const resolved = previewSrc ?? resolveAvatarUrl(src, version);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-ustawi-navy text-white ring-2 ring-white shadow-sm",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element -- preserve upload quality; avoid fill/optimizer issues
        <img
          src={resolved}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          decoding="async"
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
