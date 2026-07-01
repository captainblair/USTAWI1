import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { LeaseDetail, LeaseListItem, LeaseSignResponse } from "@/types/lease";

export async function fetchMyLeases(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<LeaseListItem>>(`/leases/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchLeaseDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<LeaseDetail>>(`/leases/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function signLease(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<LeaseSignResponse>>(`/leases/${id}/sign/`, {
    method: "POST",
    body: { role: "TENANT" },
    token,
    cache: "no-store",
  });
  return response.data;
}
