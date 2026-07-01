import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type {
  AssignTechnicianPayload,
  LandlordMaintenanceListItem,
  MaintenanceDetail,
  MaintenanceStatus,
} from "@/types/maintenance";

export async function fetchLandlordMaintenanceRequests(
  token: string,
  params?: { status?: string; urgency?: string; property_id?: string },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.urgency) search.set("urgency", params.urgency);
  if (params?.property_id) search.set("property_id", params.property_id);
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<ApiPaginated<LandlordMaintenanceListItem>>(`/landlord/maintenance/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchLandlordMaintenanceDetail(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<MaintenanceDetail>>(`/landlord/maintenance/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function assignMaintenanceTechnician(
  token: string,
  id: string,
  payload: AssignTechnicianPayload,
) {
  const response = await apiFetch<
    ApiSuccess<{ id: string; status: string; assigned_technician_name: string }>
  >(`/landlord/maintenance/${id}/assign/`, {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateMaintenanceStatus(
  token: string,
  id: string,
  status: MaintenanceStatus,
  message = "",
) {
  const response = await apiFetch<ApiSuccess<{ id: string; status: string }>>(
    `/landlord/maintenance/${id}/status/`,
    {
      method: "PATCH",
      body: { status, message },
      token,
      cache: "no-store",
    },
  );
  return response.data;
}

export async function fetchRecentLandlordMaintenance(token: string) {
  const response = await apiFetch<ApiSuccess<LandlordMaintenanceListItem[]>>(
    "/landlord/maintenance/recent/",
    { token, cache: "no-store" },
  );
  return response.data;
}
