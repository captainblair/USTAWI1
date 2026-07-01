import type { MaintenanceCategory, MaintenanceStatus, MaintenanceUrgency } from "@/types/maintenance";

export const MAINTENANCE_CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "PEST_CONTROL", label: "Pest Control" },
  { value: "SECURITY", label: "Security" },
  { value: "OTHER", label: "Other" },
];

export const MAINTENANCE_URGENCIES: { value: MaintenanceUrgency; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const MAINTENANCE_STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export const MAINTENANCE_STATUS_META: Record<
  MaintenanceStatus,
  { label: string; summaryLabel?: string; className: string; dotClass: string }
> = {
  PENDING: {
    label: "Pending",
    summaryLabel: "Awaiting assignment",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "border-blue-200 bg-blue-50 text-blue-800",
    dotClass: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dotClass: "bg-indigo-500",
  },
  RESOLVED: {
    label: "Resolved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dotClass: "bg-slate-400",
  },
};

/** Landlord-allowed next statuses from backend workflow. */
export const STATUS_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  PENDING: ["ASSIGNED", "IN_PROGRESS", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export function formatMaintenanceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function categoryLabel(category: MaintenanceCategory): string {
  return MAINTENANCE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function urgencyLabel(urgency: MaintenanceUrgency): string {
  return MAINTENANCE_URGENCIES.find((u) => u.value === urgency)?.label ?? urgency;
}
