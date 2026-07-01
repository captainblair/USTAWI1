import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { ApplicationDetail } from "@/types/application";
import type { LandlordApplicationInboxItem } from "@/types/landlord";

export async function fetchLandlordApplications(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<LandlordApplicationInboxItem>>(`/landlord/applications/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchLandlordApplicationDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<ApplicationDetail>>(`/landlord/applications/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function approveLandlordApplication(token: string, id: string, notes?: string) {
  const response = await apiFetch<
    ApiSuccess<{ id: string; status: string; lease_id?: string }>
  >(`/landlord/applications/${id}/approve/`, {
    method: "POST",
    body: notes ? { notes } : {},
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function rejectLandlordApplication(token: string, id: string, reason?: string) {
  const response = await apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/landlord/applications/${id}/reject/`,
    {
      method: "POST",
      body: reason ? { reason } : {},
      token,
      cache: "no-store",
    },
  );
  return response.data;
}

export async function reviewLandlordApplication(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/landlord/applications/${id}/review/`,
    { method: "POST", token, cache: "no-store" },
  );
  return response.data;
}
