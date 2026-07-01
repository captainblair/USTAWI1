import type { UserRole } from "@/lib/auth/constants";

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "TENANT", label: "Tenant" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "AGENT", label: "Agent" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "ADMIN", label: "Admin" },
];

export const USER_ROLE_META: Record<
  UserRole,
  { label: string; className: string }
> = {
  TENANT: { label: "Tenant", className: "bg-sky-100 text-sky-800" },
  LANDLORD: { label: "Landlord", className: "bg-violet-100 text-violet-800" },
  AGENT: { label: "Agent", className: "bg-indigo-100 text-indigo-800" },
  INSPECTOR: { label: "Inspector", className: "bg-amber-100 text-amber-800" },
  ADMIN: { label: "Admin", className: "bg-ustawi-navy/10 text-ustawi-navy" },
};

export function formatUserRole(role: UserRole) {
  return USER_ROLE_META[role]?.label ?? role;
}
