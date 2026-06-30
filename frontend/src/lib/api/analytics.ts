import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type { AdminDashboard } from "@/types/analytics";

export async function fetchAdminDashboard(token: string) {
  const response = await apiFetch<ApiSuccess<AdminDashboard>>("/analytics/admin/dashboard/", {
    token,
    cache: "no-store",
  });
  return response.data;
}
