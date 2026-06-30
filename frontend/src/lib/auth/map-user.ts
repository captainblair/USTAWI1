import type { ApiUser } from "@/types/auth";
import type { AuthUser, UserRole } from "@/lib/auth/constants";

export function mapUserFromApi(user: ApiUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role as UserRole,
    full_name: user.profile?.full_name,
    avatar: user.profile?.avatar ?? null,
    avatar_updated_at: user.profile?.updated_at,
  };
}

export function getPostAuthRedirect(role: UserRole, next?: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  switch (role) {
    case "LANDLORD":
    case "AGENT":
      return "/properties";
    case "TENANT":
      return "/saved";
    case "ADMIN":
      return "/admin";
    case "INSPECTOR":
      return "/profile";
    default:
      return "/profile";
  }
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const last = digits.slice(-3);
  return `+254 7XX XXX ${last.padStart(3, "X")}`;
}
