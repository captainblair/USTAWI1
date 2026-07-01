import type { LeaseStatus } from "@/types/lease";

export const LEASE_STATUS_META: Record<
  LeaseStatus,
  { label: string; className: string; summaryLabel?: string }
> = {
  PENDING_SIGNATURE: {
    label: "Pending signature",
    summaryLabel: "Pending",
    className: "bg-amber-50 text-amber-900 border-amber-200",
  },
  ACTIVE: {
    label: "Active",
    summaryLabel: "Active",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  EXPIRING_SOON: {
    label: "Expiring soon",
    summaryLabel: "Expiring soon",
    className: "bg-orange-50 text-orange-900 border-orange-200",
  },
  EXPIRED: {
    label: "Expired",
    summaryLabel: "Expired",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  TERMINATED: {
    label: "Terminated",
    summaryLabel: "Terminated",
    className: "bg-red-50 text-red-800 border-red-200",
  },
};

export function isSignableLease(status: LeaseStatus): boolean {
  return status === "PENDING_SIGNATURE";
}

export function isActiveLeaseStatus(status: LeaseStatus): boolean {
  return status === "ACTIVE" || status === "EXPIRING_SOON";
}

export function formatLeaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
