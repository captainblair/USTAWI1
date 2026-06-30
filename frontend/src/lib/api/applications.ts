import { API_BASE, apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type {
  ApplicationCreatePayload,
  ApplicationDetail,
  ApplicationDocument,
  ApplicationDocumentType,
  ApplicationListItem,
  ApplicationSubmitResponse,
  ApplicationUpdatePayload,
} from "@/types/application";
import { ApiRequestError } from "@/types/api";

export async function fetchMyApplications(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiFetch<ApiPaginated<ApplicationListItem>>(`/applications/${query}`, {
    token,
    cache: "no-store",
  });
  return response;
}

export async function fetchApplicationDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<ApplicationDetail>>(`/applications/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function createApplication(token: string, payload: ApplicationCreatePayload) {
  const response = await apiFetch<ApiSuccess<ApplicationDetail>>("/applications/", {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateApplication(token: string, id: string, payload: ApplicationUpdatePayload) {
  const response = await apiFetch<ApiSuccess<ApplicationDetail>>(`/applications/${id}/`, {
    method: "PATCH",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function submitApplication(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<ApplicationSubmitResponse>>(`/applications/${id}/submit/`, {
    method: "POST",
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function withdrawApplication(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/applications/${id}/withdraw/`,
    { method: "POST", token, cache: "no-store" },
  );
  return response.data;
}

export async function uploadApplicationDocument(
  token: string,
  applicationId: string,
  file: File,
  docType: ApplicationDocumentType,
  title?: string,
): Promise<ApplicationDocument> {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("doc_type", docType);
  if (title) formData.append("title", title);

  const response = await fetch(`${API_BASE}/applications/${applicationId}/documents/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as ApiSuccess<ApplicationDocument> | { success: false; error: { message: string; details?: Record<string, string[]> } };

  if (!response.ok || payload.success === false) {
    const err = payload as { error?: { message?: string; details?: Record<string, string[]> } };
    throw new ApiRequestError(
      err.error?.message ?? "Upload failed",
      response.status,
      err.error?.details,
    );
  }

  return (payload as ApiSuccess<ApplicationDocument>).data;
}
