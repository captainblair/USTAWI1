/** Human-readable labels for landlord property API field names. */
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  property_type: "Property type",
  address: "Address",
  city: "City",
  neighborhood_slug: "Neighborhood",
  price_monthly: "Monthly rent",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  latitude: "Map latitude",
  longitude: "Map longitude",
  currency: "Currency",
};

function normalizeFieldMessages(messages: unknown): string {
  if (Array.isArray(messages)) return messages.map(String).join(", ");
  if (messages == null) return "Invalid value";
  if (typeof messages === "object") return JSON.stringify(messages);
  return String(messages);
}

export function formatApiFieldErrors(details?: Record<string, unknown>): string | null {
  if (!details || Object.keys(details).length === 0) return null;
  return Object.entries(details)
    .map(([field, messages]) => {
      const label = FIELD_LABELS[field] ?? field.replace(/_/g, " ");
      return `${label}: ${normalizeFieldMessages(messages)}`;
    })
    .join(" · ");
}

export function apiFieldHasError(details: Record<string, string[]> | undefined, field: string): boolean {
  return Boolean(details?.[field]?.length);
}

/** Default map pin from neighborhood slug (matches backend seed coords). */
export function defaultCoordsForNeighborhood(slug: string): { latitude: number; longitude: number } {
  const map: Record<string, { latitude: number; longitude: number }> = {
    karen: { latitude: -1.3197, longitude: 36.7073 },
    westlands: { latitude: -1.2676, longitude: 36.8078 },
    kilimani: { latitude: -1.292066, longitude: 36.785016 },
    peponi: { latitude: -1.24, longitude: 36.8 },
    lavington: { latitude: -1.279, longitude: 36.768 },
    parklands: { latitude: -1.263, longitude: 36.819 },
  };
  return map[slug.trim().toLowerCase()] ?? { latitude: -1.286389, longitude: 36.817223 };
}
