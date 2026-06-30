import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { SavedProperty } from "@/types/property";

export async function fetchSavedProperties(token: string, page = 1) {
  return apiFetch<ApiPaginated<SavedProperty>>(`/saved-properties/?page=${page}`, {
    token,
    cache: "no-store",
  });
}

export async function saveProperty(propertyId: string, token: string) {
  return apiFetch<ApiSuccess<SavedProperty>>("/saved-properties/", {
    method: "POST",
    body: { property_id: propertyId },
    token,
    cache: "no-store",
  });
}

export async function unsaveProperty(propertyId: string, token: string) {
  return apiFetch<ApiSuccess<null>>(`/saved-properties/${propertyId}/`, {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}

/** Fetch all saved property IDs (paginates until exhausted). */
export async function fetchSavedPropertyIds(token: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await fetchSavedProperties(token, page);
    response.results.forEach((item) => ids.add(item.property.id));
    hasNext = Boolean(response.next);
    page += 1;
  }

  return ids;
}
