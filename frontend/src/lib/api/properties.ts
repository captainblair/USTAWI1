import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { FilterMetadata, PropertyDetail, PropertyListItem, PropertySearchParams } from "@/types/property";

function toQuery(params: PropertySearchParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchFeaturedProperties() {
  const response = await apiFetch<ApiSuccess<PropertyListItem[]>>("/properties/featured/", {
    next: { revalidate: 300 },
  });
  return response.data;
}

export async function fetchProperties(params: PropertySearchParams = {}) {
  const response = await apiFetch<ApiPaginated<PropertyListItem>>(
    `/properties/${toQuery(params)}`,
    { cache: "no-store" },
  );
  return response;
}

export async function fetchPropertyDetail(identifier: string, token?: string) {
  const response = await apiFetch<ApiSuccess<PropertyDetail>>(`/properties/${identifier}/`, {
    cache: "no-store",
    token,
  });
  return response.data;
}

export async function fetchFilterMetadata() {
  const response = await apiFetch<ApiSuccess<FilterMetadata>>("/properties/filters/", {
    next: { revalidate: 600 },
  });
  return response.data;
}
