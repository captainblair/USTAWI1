import { API_BASE, apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import { ApiRequestError } from "@/types/api";
import type {
  CreateMaintenancePayload,
  MaintenanceDetail,
  MaintenanceListItem,
  MaintenancePhoto,
} from "@/types/maintenance";

export async function fetchMyMaintenanceRequests(
  token: string,
  params?: { status?: string; category?: string },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<ApiPaginated<MaintenanceListItem>>(`/maintenance/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchMaintenanceDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<MaintenanceDetail>>(`/maintenance/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function createMaintenanceRequest(token: string, payload: CreateMaintenancePayload) {
  const formData = new FormData();
  formData.append("lease_id", payload.lease_id);
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("category", payload.category);
  formData.append("urgency", payload.urgency);
  if (payload.unit_label) formData.append("unit_label", payload.unit_label);
  payload.photos?.forEach((file) => formData.append("photos", file));

  const response = await fetch(`${API_BASE}/maintenance/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json()) as ApiSuccess<MaintenanceDetail> | {
    success: false;
    error: { message?: string; details?: Record<string, string[]> };
  };

  if (!response.ok || body.success === false) {
    const err = body as { error?: { message?: string; details?: Record<string, string[]> } };
    throw new ApiRequestError(
      err.error?.message ?? "Could not submit maintenance request.",
      response.status,
      err.error?.details,
    );
  }

  return (body as ApiSuccess<MaintenanceDetail>).data;
}

export async function addMaintenancePhoto(token: string, requestId: string, file: File, caption = "") {
  const formData = new FormData();
  formData.append("image", file);
  if (caption) formData.append("caption", caption);

  const response = await fetch(`${API_BASE}/maintenance/${requestId}/photos/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json()) as ApiSuccess<MaintenancePhoto> | {
    success: false;
    error: { message?: string; details?: Record<string, string[]> };
  };

  if (!response.ok || body.success === false) {
    const err = body as { error?: { message?: string; details?: Record<string, string[]> } };
    throw new ApiRequestError(
      err.error?.message ?? "Could not upload photo.",
      response.status,
      err.error?.details,
    );
  }

  return (body as ApiSuccess<MaintenancePhoto>).data;
}
