import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type { AdminDashboard, ChartData, TenantDashboard } from "@/types/analytics";
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

export async function fetchTenantDashboard(token: string) {
  const response = await apiFetch<ApiSuccess<TenantDashboard>>("/analytics/tenant/dashboard/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchChartRevenue(token: string, months = 6) {
  const response = await apiFetch<ApiSuccess<ChartData>>(`/analytics/charts/revenue/?months=${months}`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchChartApplications(token: string) {
  const response = await apiFetch<ApiSuccess<ChartData>>("/analytics/charts/applications/", {
    token,
    cache: "no-store",
  });
  return response.data;
}
