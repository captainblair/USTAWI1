import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type { VerificationPipelineStats } from "@/types/verification";

export async function fetchVerificationPipeline(token: string) {
  const response = await apiFetch<ApiSuccess<VerificationPipelineStats>>("/admin/verification/pipeline/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchVerificationOverview(token: string) {
  const response = await apiFetch<ApiSuccess<VerificationPipelineStats>>("/admin/verification/overview/", {
    token,
    cache: "no-store",
  });
  return response.data;
}
