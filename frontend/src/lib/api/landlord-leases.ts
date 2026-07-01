import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { LeaseDetail, LeaseListItem, LeaseSignResponse } from "@/types/lease";

export async function fetchLandlordLeases(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<LeaseListItem>>(`/landlord/leases/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchLandlordLeaseDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<LeaseDetail>>(`/landlord/leases/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function signLandlordLease(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<LeaseSignResponse>>(`/landlord/leases/${id}/sign/`, {
    method: "POST",
    body: { role: "LANDLORD" },
    token,
    cache: "no-store",
  });
  return response.data;
}
