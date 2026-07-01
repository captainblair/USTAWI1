import type { InvoiceStatus, PaymentStatus } from "@/types/payment";

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  PAID: { label: "Paid", className: "bg-emerald-100 text-emerald-800" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", className: "bg-purple-100 text-purple-800" },
};

export function formatPaymentDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatKenyanPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1, 10)}`;
  if (digits.length <= 9) return digits ? `+254${digits}` : "";
  return `+254${digits.slice(0, 9)}`;
}
