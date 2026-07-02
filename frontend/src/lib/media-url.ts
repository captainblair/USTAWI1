const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

/** Backend origin used for uploaded property media (e.g. http://localhost:8001). */
export function getApiMediaOrigin(): string {
  try {
    const url = new URL(API_BASE);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.origin;
  } catch {
    return "http://localhost:8001";
  }
}

function isLocalMediaHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Next.js 16 blocks `http://localhost:8001/media/...` in the image optimizer (private IP).
 * Route those through our `/media/*` rewrite instead so optimization stays same-origin.
 */
export function toOptimizableImageSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("/media/") || trimmed.startsWith("/images/")) {
    return trimmed;
  }

  if (trimmed.startsWith("media/")) {
    return `/${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.pathname.startsWith("/media/")) {
      return trimmed;
    }

    if (isLocalMediaHost(parsed.hostname) || parsed.origin === getApiMediaOrigin()) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/** Normalize API image URLs; returns null when missing or blank. */
export function resolvePropertyImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  return toOptimizableImageSrc(url.trim());
}

/** Primary listing image with optional local fallback path. */
export function propertyImageSrc(
  primary: string | null | undefined,
  fallback?: string,
): string {
  const resolved = resolvePropertyImageUrl(primary);
  if (resolved) return resolved;
  return fallback
    ? toOptimizableImageSrc(fallback)
    : "/images/houses/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-35-1024x683.jpg";
}

/** Profile avatar URL — use direct backend origin (plain <img>, not Next Image optimizer). */
export function resolveAvatarUrl(
  url: string | null | undefined,
  version?: string | null,
): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  let resolved = trimmed;

  if (trimmed.startsWith("/media/")) {
    resolved = `${getApiMediaOrigin()}${trimmed}`;
  } else if (trimmed.startsWith("media/")) {
    resolved = `${getApiMediaOrigin()}/${trimmed}`;
  }

  if (!version) return resolved;
  const sep = resolved.includes("?") ? "&" : "?";
  return `${resolved}${sep}v=${encodeURIComponent(version)}`;
}
