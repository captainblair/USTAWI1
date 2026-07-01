import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { UserRole } from "@/lib/auth/constants";
import type { AdminUserDetail, AdminUserListItem } from "@/types/admin-users";

export async function fetchAdminUsers(
  token: string,
  params?: { role?: string; search?: string; page?: number },
) {
  const search = new URLSearchParams();
  if (params?.role) search.set("role", params.role);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<ApiPaginated<AdminUserListItem>>(`/admin/users/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchAdminUser(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<AdminUserDetail>>(`/admin/users/${id}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateAdminUserRole(token: string, id: string, role: UserRole) {
  const response = await apiFetch<ApiSuccess<AdminUserDetail>>(`/admin/users/${id}/`, {
    method: "PATCH",
    body: { role },
    token,
  });
  return response.data;
}
