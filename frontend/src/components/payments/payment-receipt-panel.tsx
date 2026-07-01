"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DownloadReceiptButton } from "@/components/payments/download-receipt-button";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchPaymentReceipt } from "@/lib/api/payments";
import { isTenant } from "@/lib/auth/constants";
import { formatPaymentDate } from "@/lib/payments/status";
import type { PaymentReceipt } from "@/types/payment";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

export function PaymentReceiptPanel({ receiptId }: { receiptId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/payments/receipts/${receiptId}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPaymentReceipt(accessToken!, receiptId);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load receipt.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, receiptId, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-700">{error ?? "Receipt not found."}</p>
        <Link href="/payments" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
          Back to billing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#E8EAF2] bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-bold text-ustawi-navy">Payment receipt</h1>
      <p className="mt-1 text-sm text-ustawi-muted">{receipt.receipt_number}</p>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-3 border-b border-[#E8EAF2] pb-2">
          <dt className="text-ustawi-muted">Invoice</dt>
          <dd className="font-medium">{receipt.invoice_number}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-[#E8EAF2] pb-2">
          <dt className="text-ustawi-muted">Amount</dt>
          <dd className="font-bold">{formatPrice(receipt.payment_amount, receipt.payment_currency)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-[#E8EAF2] pb-2">
          <dt className="text-ustawi-muted">M-Pesa ref</dt>
          <dd className="font-mono text-xs">{receipt.mpesa_receipt_number || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ustawi-muted">Paid on</dt>
          <dd>{formatPaymentDate(receipt.completed_at)}</dd>
        </div>
      </dl>

      <DownloadReceiptButton receiptId={receiptId} receiptNumber={receipt.receipt_number} className="mt-6" />

      <Link href="/payments" className="mt-4 block text-center text-sm font-semibold text-ustawi-navy hover:underline">
        Back to billing
      </Link>
    </div>
  );
}
