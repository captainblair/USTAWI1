"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DownloadReceiptButton } from "@/components/payments/download-receipt-button";
import {
  formatPaymentSuccessDate,
  maskMpesaPhone,
  PaymentDetailsCard,
  PaymentSuccessIcon,
} from "@/components/payments/payment-success-icon";
import { PaymentSuccessShell } from "@/components/payments/payment-success-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchPaymentStatus } from "@/lib/api/payments";
import { isTenant } from "@/lib/auth/constants";
import type { PaymentHistoryItem } from "@/types/payment";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

function PaymentSuccessActions({
  receiptId,
  receiptNumber,
}: {
  receiptId?: string | null;
  receiptNumber?: string | null;
}) {
  return (
    <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:max-w-md sm:mx-auto md:max-w-none md:flex-row md:items-center">
      <Link href="/dashboard" className="md:inline-flex">
        <Button
          type="button"
          className="h-11 w-full rounded-full bg-[#EF3D32] px-8 text-sm font-semibold text-white hover:bg-[#EF3D32]/90 md:w-auto"
        >
          Back to Dashboard
        </Button>
      </Link>
      {receiptId && (
        <DownloadReceiptButton
          receiptId={receiptId}
          receiptNumber={receiptNumber}
          variant="outline"
          label="Download Receipt"
          fullWidth
          className="md:w-auto"
        />
      )}
      <Link href="/payments" className="md:inline-flex">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full border-2 border-[#1F2B6C] bg-white px-8 text-sm font-semibold text-[#1F2B6C] hover:bg-[#FAFBFE] md:w-auto"
        >
          View Payment History
        </Button>
      </Link>
    </div>
  );
}

export function PaymentSuccessPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment");
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [payment, setPayment] = useState<PaymentHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!paymentId) {
      router.replace("/payments");
      return;
    }
    const id = paymentId;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/payments/success?payment=${id}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPaymentStatus(accessToken!, id);
        if (!cancelled) {
          if (data.status !== "COMPLETED") {
            router.replace(`/payments/confirm/${id}`);
            return;
          }
          setPayment(data);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load payment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, paymentId, router, user]);

  if (authLoading || loading) {
    return (
      <PaymentSuccessShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
        </div>
      </PaymentSuccessShell>
    );
  }

  if (error || !payment) {
    return (
      <PaymentSuccessShell>
        <div className="py-12 text-center">
          <p className="text-sm text-red-700">{error ?? "Payment not found."}</p>
          <Link href="/payments" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
            Back to billing
          </Link>
        </div>
      </PaymentSuccessShell>
    );
  }

  const amountLabel = formatPrice(payment.amount, payment.currency);
  const confirmation = payment.mpesa_receipt_number ?? payment.receipt_number ?? "—";

  return (
    <PaymentSuccessShell>
      <div className="text-center">
        <PaymentSuccessIcon />

        <h1 className="mt-8 text-3xl font-bold text-ustawi-navy sm:text-4xl">Payment Successful!</h1>
        <p className="mt-3 text-base text-ustawi-muted sm:text-lg">
          Your payment has successfully processed.
        </p>

        <PaymentDetailsCard
          amount={amountLabel}
          phoneMasked={maskMpesaPhone(payment.phone_number)}
          date={formatPaymentSuccessDate(payment.completed_at)}
          invoiceRef={payment.invoice_number}
          confirmationNumber={confirmation}
        />

        <PaymentSuccessActions receiptId={payment.receipt_id} receiptNumber={payment.receipt_number} />
      </div>
    </PaymentSuccessShell>
  );
}
