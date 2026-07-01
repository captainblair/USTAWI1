import type { UserRole } from "@/lib/auth/constants";

export type AdminUserListItem = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  last_login: string | null;
  created_at: string;
};

export type AdminUserDetail = AdminUserListItem & {
  city: string;
  country: string;
  address: string;
  id_document_verified: boolean;
  income_verified: boolean;
  updated_at: string;
};
