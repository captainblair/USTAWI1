import { API_BASE, apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { LandlordPropertyCreatePayload, LandlordPropertyUpdatePayload } from "@/types/landlord";
import type { PropertyDetail, PropertyListItem } from "@/types/property";
import { ApiRequestError } from "@/types/api";

export async function fetchLandlordProperties(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<PropertyListItem>>(`/landlord/properties/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchLandlordPropertyDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<PropertyDetail>>(`/landlord/properties/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function createLandlordProperty(token: string, payload: LandlordPropertyCreatePayload) {
  const response = await apiFetch<ApiSuccess<PropertyDetail>>("/landlord/properties/", {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateLandlordProperty(
  token: string,
  id: string,
  payload: LandlordPropertyUpdatePayload,
) {
  const response = await apiFetch<ApiSuccess<PropertyDetail>>(`/landlord/properties/${id}/`, {
    method: "PATCH",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function publishLandlordProperty(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/landlord/properties/${id}/publish/`,
    { method: "POST", token, cache: "no-store" },
  );
  return response;
}

export type PropertyImageUploadOptions = {
  isPrimary?: boolean;
  sortOrder?: number;
  imageType?: "GALLERY" | "FLOOR_PLAN" | "THUMBNAIL";
  caption?: string;
};

export async function uploadLandlordPropertyImage(
  token: string,
  propertyId: string,
  file: File,
  options: PropertyImageUploadOptions = {},
) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("image_type", options.imageType ?? "GALLERY");
  formData.append("is_primary", String(options.isPrimary ?? false));
  if (options.sortOrder !== undefined) {
    formData.append("sort_order", String(options.sortOrder));
  }
  if (options.caption) {
    formData.append("caption", options.caption);
  }

  const response = await fetch(`${API_BASE}/landlord/properties/${propertyId}/images/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as ApiSuccess<unknown> | { success: false; error?: { message?: string } };
  if (!response.ok || payload.success !== true) {
    const err = payload as { error?: { message?: string } };
    throw new ApiRequestError(err.error?.message ?? "Image upload failed", response.status);
  }
  return payload.data;
}

export async function deleteLandlordPropertyImage(token: string, propertyId: string, imageId: string) {
  await apiFetch<{ success: true; message: string }>(
    `/landlord/properties/${propertyId}/images/${imageId}/`,
    { method: "DELETE", token, cache: "no-store" },
  );
}

export async function setLandlordPropertyPrimaryImage(token: string, propertyId: string, imageId: string) {
  const response = await apiFetch<ApiSuccess<{ id: string; is_primary: boolean }>>(
    `/landlord/properties/${propertyId}/images/${imageId}/set-primary/`,
    { method: "POST", token, cache: "no-store" },
  );
  return response.data;
}

export async function deleteLandlordProperty(token: string, id: string) {
  await apiFetch<{ success: true; message: string }>(`/landlord/properties/${id}/`, {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}
