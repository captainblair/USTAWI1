import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { CaseMessage, SupportCaseDetail, SupportCaseListItem, SupportCaseStatus } from "@/types/support";

export async function fetchAdminSupportCases(
  token: string,
  params?: { status?: string; category?: string; urgency?: string },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  if (params?.urgency) search.set("urgency", params.urgency);
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<ApiPaginated<SupportCaseListItem>>(`/admin/support/cases/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchAdminSupportCase(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<SupportCaseDetail>>(`/admin/support/cases/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateSupportCaseStatus(
  token: string,
  id: string,
  status: SupportCaseStatus,
  resolution_notes = "",
) {
  return apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/admin/support/cases/${id}/status/`,
    { method: "PATCH", body: { status, resolution_notes }, token },
  );
}

export async function escalateSupportCase(token: string, id: string, note = "") {
  return apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/admin/support/cases/${id}/escalate/`,
    { method: "POST", body: { note }, token },
  );
}

export async function addSupportCaseMessage(
  token: string,
  id: string,
  body: string,
  isInternal = false,
) {
  const response = await apiFetch<ApiSuccess<CaseMessage>>(`/admin/support/cases/${id}/messages/`, {
    method: "POST",
    body: { body, is_internal: isInternal },
    token,
  });
  return response.data;
}
