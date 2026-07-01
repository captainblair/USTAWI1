import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type {
  ReviewStatus,
  SafetyScoreFormData,
  VerificationCaseDetail,
  VerificationQueueResponse,
} from "@/types/verification";

export async function fetchInspectorQueue(token: string, tab = "pending") {
  return apiFetch<VerificationQueueResponse>(`/inspector/verification/queue/?tab=${tab}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchVerificationCase(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<VerificationCaseDetail>>(
    `/inspector/verification/cases/${id}/`,
    { token, cache: "no-store" },
  );
  return response.data;
}

export async function startVerificationReview(token: string, id: string) {
  return apiFetch<ApiSuccess<{ status: string }>>(`/inspector/verification/cases/${id}/review/`, {
    method: "POST",
    token,
  });
}

export async function submitSafetyScore(token: string, id: string, data: SafetyScoreFormData) {
  return apiFetch<ApiSuccess<{ overall_score: number }>>(
    `/inspector/verification/cases/${id}/safety-score/`,
    { method: "POST", body: data, token },
  );
}

export async function reviewVerificationDocument(
  token: string,
  caseId: string,
  docId: string,
  status: ReviewStatus,
  notes = "",
) {
  return apiFetch<ApiSuccess<{ status: string }>>(
    `/inspector/verification/cases/${caseId}/documents/${docId}/`,
    { method: "PATCH", body: { status, notes }, token },
  );
}

export async function reviewVerificationPhoto(
  token: string,
  caseId: string,
  photoId: string,
  status: ReviewStatus,
  notes = "",
) {
  return apiFetch<ApiSuccess<{ status: string }>>(
    `/inspector/verification/cases/${caseId}/photos/${photoId}/`,
    { method: "PATCH", body: { status, notes }, token },
  );
}

export async function approveVerificationCase(token: string, id: string, notes = "") {
  return apiFetch<ApiSuccess<Record<string, unknown>>>(
    `/inspector/verification/cases/${id}/approve/`,
    { method: "POST", body: { notes }, token },
  );
}

export async function rejectVerificationCase(token: string, id: string, reason = "") {
  return apiFetch<ApiSuccess<Record<string, unknown>>>(
    `/inspector/verification/cases/${id}/reject/`,
    { method: "POST", body: { reason }, token },
  );
}

export async function requestVerificationChanges(token: string, id: string, message = "") {
  return apiFetch<ApiSuccess<Record<string, unknown>>>(
    `/inspector/verification/cases/${id}/request-changes/`,
    { method: "POST", body: { message }, token },
  );
}
