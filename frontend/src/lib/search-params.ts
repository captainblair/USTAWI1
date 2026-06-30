import type { FilterMetadata, PropertySearchParams } from "@/types/property";
import { formatPrice, formatPropertyType } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: string;
  paramKeys: string[];
};

export function hasActiveSearch(filters: PropertySearchParams) {
  const ignore = new Set(["page", "ordering"]);
  return Object.entries(filters).some(
    ([key, value]) => !ignore.has(key) && value != null && value !== "",
  );
}

export function buildFilterChips(
  filters: PropertySearchParams,
  metadata: FilterMetadata,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.neighborhood) {
    const n = metadata.neighborhoods.find((x) => x.slug === filters.neighborhood);
    chips.push({
      id: "neighborhood",
      label: n?.name ?? filters.neighborhood,
      paramKeys: ["neighborhood"],
    });
  } else if (filters.city) {
    chips.push({ id: "city", label: filters.city, paramKeys: ["city"] });
  } else if (filters.q) {
    chips.push({ id: "q", label: filters.q, paramKeys: ["q"] });
  }

  if (filters.min_price || filters.max_price) {
    const min = filters.min_price ? formatPrice(filters.min_price) : null;
    const max = filters.max_price ? formatPrice(filters.max_price) : null;
    let label = "Any price";
    if (min && max) label = `${min} – ${max}`;
    else if (min) label = `${min}+`;
    else if (max) label = `Up to ${max}`;
    chips.push({
      id: "price",
      label,
      paramKeys: ["min_price", "max_price"],
    });
  }

  if (filters.min_safety_score) {
    chips.push({
      id: "safety",
      label: `Safety ${filters.min_safety_score}+`,
      paramKeys: ["min_safety_score"],
    });
  }

  if (filters.amenities) {
    filters.amenities.split(",").forEach((slug) => {
      const a = metadata.amenities.find((x) => x.slug === slug.trim());
      chips.push({
        id: `amenity-${slug}`,
        label: a?.name ?? slug,
        paramKeys: ["amenities"],
        // amenities is comma-separated — simplified: clear all amenities on remove one for MVP
      });
    });
  }

  if (filters.property_type) {
    const t = metadata.property_types.find((x) => x.value === filters.property_type);
    chips.push({
      id: "property_type",
      label: t?.label ?? formatPropertyType(filters.property_type),
      paramKeys: ["property_type"],
    });
  }

  if (filters.min_beds) {
    chips.push({
      id: "min_beds",
      label: `${filters.min_beds}+ beds`,
      paramKeys: ["min_beds", "max_beds"],
    });
  }

  if (filters.bbox) {
    chips.push({ id: "bbox", label: "Map area", paramKeys: ["bbox"] });
  }

  if (filters.lat && filters.lng && filters.radius) {
    chips.push({
      id: "radius",
      label: `${filters.radius} km radius`,
      paramKeys: ["lat", "lng", "radius"],
    });
  }

  return chips;
}

export function removeFilterParams(
  current: PropertySearchParams,
  paramKeys: string[],
): PropertySearchParams {
  const next = { ...current };
  paramKeys.forEach((key) => {
    delete (next as Record<string, string | undefined>)[key];
  });
  delete next.page;
  return next;
}

export function paramsToQueryString(params: PropertySearchParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}
