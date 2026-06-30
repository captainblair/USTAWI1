/** Default map centre — Nairobi CBD */
export const NAIROBI_CENTER = { lat: -1.286389, lng: 36.817223 };

export const DEFAULT_ZOOM = 12;

/** Backend bbox format: min_lng,min_lat,max_lng,max_lat */
export function formatBbox(minLng: number, minLat: number, maxLng: number, maxLat: number) {
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export function parseBbox(bbox: string): [number, number, number, number] | null {
  const parts = bbox.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return parts as [number, number, number, number];
}

export function parseCenter(lat?: string | null, lng?: string | null) {
  if (!lat || !lng) return null;
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  return { lat: la, lng: ln };
}
