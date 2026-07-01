import { apiFetch, type ApiPaginated, type ApiSuccess } from "@/lib/api/client";
import type { PayRentResponse, PaymentHistoryItem } from "@/types/payment";

export async function fetchPaymentHistory(token: string) {
  return apiFetch<ApiPaginated<PaymentHistoryItem>>("/payments/history/", {
    token,
    cache: "no-store",
  });
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
