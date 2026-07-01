import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type {
  ActivityEvent,
  NotificationBadge,
  NotificationItem,
  NotificationsListResponse,
} from "@/types/notifications";

export async function fetchNotifications(
  token: string,
  params?: { category?: string; unread?: boolean; page?: number },
) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.unread) search.set("unread", "true");
  if (params?.page) search.set("page", String(params.page));
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<NotificationsListResponse>(`/notifications/${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchNotificationBadge(token: string) {
  const response = await apiFetch<ApiSuccess<NotificationBadge>>("/notifications/badge/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function markNotificationRead(token: string, id: string) {
  const response = await apiFetch<ApiSuccess<NotificationItem>>(`/notifications/${id}/read/`, {
    method: "POST",
    token,
  });
  return response.data;
}

export async function markAllNotificationsRead(token: string) {
  const response = await apiFetch<ApiSuccess<{ marked_count: number }>>("/notifications/read-all/", {
    method: "POST",
    token,
  });
  return response.data;
}

export async function fetchActivityFeed(token: string, params?: { category?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.page) search.set("page", String(params.page));
  const query = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<ApiPaginated<ActivityEvent>>(`/notifications/activity/${query}`, {
    token,
    cache: "no-store",
  });
}
