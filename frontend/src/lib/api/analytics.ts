import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type { AdminDashboard } from "@/types/analytics";
import type { LandlordDashboard } from "@/types/landlord";

export async function fetchAdminDashboard(token: string) {
  const response = await apiFetch<ApiSuccess<AdminDashboard>>("/analytics/admin/dashboard/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchLandlordDashboard(token: string) {
  const response = await apiFetch<ApiSuccess<LandlordDashboard>>("/analytics/landlord/dashboard/", {
    token,
    cache: "no-store",
  });
  return response.data;
}
