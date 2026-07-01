import { apiFetch, type ApiPaginated } from "@/lib/api/client";
import type { CommunityReport } from "@/types/verification";

export async function fetchCommunityReportsModeration(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<CommunityReport>>(`/community-reports/moderation/${query}`, {
    token,
    cache: "no-store",
  });
}
