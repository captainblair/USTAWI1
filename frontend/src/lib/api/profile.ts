import { API_BASE, apiFetch, type ApiSuccess } from "@/lib/api/client";
import type { UserProfile, UserProfileUpdate } from "@/types/profile";
import { ApiRequestError } from "@/types/api";

export async function fetchProfile(token: string) {
  const response = await apiFetch<ApiSuccess<UserProfile>>("/profile/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function updateProfile(token: string, payload: UserProfileUpdate) {
  const response = await apiFetch<ApiSuccess<UserProfile>>("/profile/", {
    method: "PATCH",
    body: payload,
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function uploadProfileAvatar(token: string, file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE}/profile/`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as ApiSuccess<UserProfile> | { success: false; error?: { message?: string; details?: Record<string, string[]> } };

  if (!response.ok || payload.success !== true) {
    const err = payload as { error?: { message?: string; details?: Record<string, string[]> } };
    throw new ApiRequestError(
      err.error?.message ?? "Could not upload photo",
      response.status,
      err.error?.details,
    );
  }

  return payload.data;
}