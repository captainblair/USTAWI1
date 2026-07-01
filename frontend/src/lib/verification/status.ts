import type { VerificationCaseStatus } from "@/types/verification";

export const VERIFICATION_QUEUE_TABS = [
  { value: "pending", label: "Pending", status: "PENDING" as VerificationCaseStatus },
  { value: "in_review", label: "In review", status: "IN_REVIEW" as VerificationCaseStatus },
  { value: "awaiting_docs", label: "Awaiting docs", status: "AWAITING_DOCS" as VerificationCaseStatus },
  { value: "rejected", label: "Rejected", status: "REJECTED" as VerificationCaseStatus },
];

export const VERIFICATION_STATUS_META: Record<
  VerificationCaseStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  IN_REVIEW: { label: "In review", className: "bg-blue-100 text-blue-800" },
  AWAITING_DOCS: { label: "Awaiting docs", className: "bg-orange-100 text-orange-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
};

export const SAFETY_FACTOR_LABELS: Record<string, string> = {
  NEIGHBORHOOD: "Neighborhood safety",
  BUILDING_CONDITION: "Building condition",
  ACCESS_CONTROL: "Access control",
  LIGHTING: "Lighting",
  EMERGENCY_READINESS: "Emergency readiness",
};

export function formatVerificationDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
