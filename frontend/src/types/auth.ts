import type { UserRole } from "@/lib/auth/constants";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type ApiUserProfile = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatar?: string | null;
  updated_at?: string;
};

export type ApiUser = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  profile?: ApiUserProfile;
};

export type RegistrationRole = "TENANT" | "LANDLORD" | "AGENT";

export type RegisterRoleResponse = {
  registration_token: string;
  role: RegistrationRole;
  step: string;
  expires_at: string;
};

export type RegisterProfileResponse = {
  registration_token: string;
  step: string;
  phone: string;
  otp_expires_in_minutes?: number;
  otp_delivery?: "in_app" | "sms";
  dev_otp?: string;
};

export type RegisterSendOtpResponse = {
  registration_token: string;
  step: string;
  phone: string;
  otp_expires_in_minutes: number;
  otp_delivery?: "in_app" | "sms";
  dev_otp?: string;
};

export type AuthPayload = {
  user: ApiUser;
  tokens: AuthTokens;
};
