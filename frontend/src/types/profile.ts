import type { UserRole } from "@/lib/auth/constants";

export type UserProfile = {
  email: string;
  phone: string;
  role: UserRole;
  full_name: string;
  avatar: string | null;
  date_of_birth: string | null;
  address: string;
  city: string;
  country: string;
  id_document_verified: boolean;
  income_verified: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProfileUpdate = {
  full_name?: string;
  date_of_birth?: string | null;
  address?: string;
  city?: string;
  country?: string;
};
