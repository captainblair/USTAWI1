import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import { downloadPaymentReceiptFile } from "@/lib/payments/download-receipt";
import type {
  InvoiceListItem,
  LandlordCollectedPayment,
  LandlordIncomeSummary,
  PayRentResponse,
  PaymentHistoryItem,
  PaymentReceipt,
  RentDueItem,
} from "@/types/payment";
export async function fetchRentDue(token: string) {
  const response = await apiFetch<ApiSuccess<RentDueItem[]>>("/payments/rent-due/", {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchInvoices(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiPaginated<InvoiceListItem>>(`/payments/invoices${query}`, {
    token,
    cache: "no-store",
  });
}

export async function fetchPaymentHistory(token: string) {
  return apiFetch<ApiPaginated<PaymentHistoryItem>>("/payments/history/", {
    token,
    cache: "no-store",
  });
}

export async function fetchPaymentStatus(token: string, paymentId: string) {
  const response = await apiFetch<ApiSuccess<PaymentHistoryItem>>(`/payments/payments/${paymentId}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function fetchPaymentReceipt(token: string, receiptId: string) {
  const response = await apiFetch<ApiSuccess<PaymentReceipt>>(`/payments/receipts/${receiptId}/`, {
    token,
    cache: "no-store",
  });
  return response.data;
}

export async function initiateRentPayment(token: string, leaseId: string, phone?: string) {
  const response = await apiFetch<ApiSuccess<PayRentResponse>>("/payments/pay-rent/", {
    method: "POST",
    body: { lease_id: leaseId, ...(phone ? { phone } : {}) },
    token,
    cache: "no-store",
  });
  return response.data;
}

/** DEBUG-only: simulate M-Pesa callback when STK was cancelled or sandbox is stuck. */
export async function downloadPaymentReceipt(token: string, receiptId: string, fallbackName?: string) {
  return downloadPaymentReceiptFile(token, receiptId, fallbackName);
}

export async function simulatePaymentCallback(token: string, paymentId: string, success = true) {
  return apiFetch<ApiSuccess<{ status: string }>>("/payments/webhooks/dev/simulate-callback/", {
    method: "POST",
    body: { payment_id: paymentId, success },
    token,
    cache: "no-store",
  });
}

export async function fetchLandlordPaymentSummary(token: string, month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  const response = await apiFetch<ApiSuccess<LandlordIncomeSummary>>(
    `/landlord/payments/summary${query}`,
    { token, cache: "no-store" },
  );
  return response.data;
}

export async function fetchLandlordCollectedPayments(token: string, propertyId?: string) {
  const query = propertyId ? `?property_id=${encodeURIComponent(propertyId)}` : "";
  return apiFetch<ApiPaginated<LandlordCollectedPayment>>(`/landlord/payments/collected${query}`, {
    token,
    cache: "no-store",
  });
}
