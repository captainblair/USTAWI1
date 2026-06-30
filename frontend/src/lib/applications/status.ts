import type { ApplicationStatus } from "@/types/application";

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-amber-50 text-amber-900 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-800 border-red-200",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function isEditableApplicationStatus(status: ApplicationStatus): boolean {
  return status === "DRAFT";
}

export function isActiveApplicationStatus(status: ApplicationStatus): boolean {
  return ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(status);
}
