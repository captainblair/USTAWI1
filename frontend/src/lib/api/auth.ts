import { apiFetch, type ApiSuccess } from "@/lib/api/client";
import type {
  AuthPayload,
  RegisterProfileResponse,
  RegisterRoleResponse,
  RegisterSendOtpResponse,
  RegistrationRole,
} from "@/types/auth";

export async function loginWithEmail(email: string, password: string) {
  const response = await apiFetch<ApiSuccess<AuthPayload>>("/auth/login/", {
    method: "POST",
    body: { email, password },
    cache: "no-store",
  });
  return response.data;
}

export async function logout(refreshToken: string, accessToken: string) {
  return apiFetch<ApiSuccess<null>>("/auth/logout/", {
    method: "POST",
    body: { refresh: refreshToken },
    token: accessToken,
    cache: "no-store",
  });
}

export async function fetchCurrentUser(token: string) {
  const response = await apiFetch<ApiSuccess<import("@/types/auth").ApiUser>>("/auth/me/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function registerRole(role: RegistrationRole) {
  const response = await apiFetch<ApiSuccess<RegisterRoleResponse>>("/auth/register/role/", {
    method: "POST",
    body: { role },
    cache: "no-store",
  });
  return response.data;
}

export async function registerProfile(payload: {
  registration_token: string;
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  phone: string;
}) {
  const response = await apiFetch<ApiSuccess<RegisterProfileResponse>>("/auth/register/profile/", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
  return response.data;
}

export async function registerSendOtp(registrationToken: string) {
  const response = await apiFetch<ApiSuccess<RegisterSendOtpResponse>>("/auth/register/send-otp/", {
    method: "POST",
    body: { registration_token: registrationToken },
    cache: "no-store",
  });
  return response.data;
}

export async function registerVerifyOtp(registrationToken: string, otp: string) {
  const response = await apiFetch<ApiSuccess<AuthPayload>>("/auth/register/verify/", {
    method: "POST",
    body: { registration_token: registrationToken, otp },
    cache: "no-store",
  });
  return response.data;
}
