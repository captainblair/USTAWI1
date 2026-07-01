"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchPaymentStatus, simulatePaymentCallback } from "@/lib/api/payments";
import { isTenant } from "@/lib/auth/constants";
import type { PaymentHistoryItem } from "@/types/payment";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

const POLL_MS = 2000;
const MAX_POLLS = 45;

export function PaymentConfirmPanel({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [payment, setPayment] = useState<PaymentHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [simulating, setSimulating] = useState(false);

  const poll = useCallback(async () => {
    if (!accessToken) return null;
    return fetchPaymentStatus(accessToken, paymentId);
  }, [accessToken, paymentId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/payments/confirm/${paymentId}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check(status?: PaymentHistoryItem) {
      try {
        const data = status ?? (await poll());
        if (cancelled || !data) return;
        setPayment(data);
        setLoading(false);

        if (data.status === "COMPLETED") {
          router.replace(`/payments/success?payment=${paymentId}`);
          return;
        }
        if (data.status === "FAILED") {
          setError("Payment failed or was cancelled on M-Pesa.");
          return;
        }

        setPollCount((c) => {
          const next = c + 1;
          if (next < MAX_POLLS) {
            timer = setTimeout(() => check(), POLL_MS);
          } else {
            setError("Payment is taking longer than expected. You can retry or use demo complete.");
          }
          return next;
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not check payment status.");
          setLoading(false);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accessToken, authLoading, isAuthenticated, paymentId, poll, router, user]);

  async function handleDemoComplete() {
    if (!accessToken) return;
    setSimulating(true);
    setError(null);
    try {
      await simulatePaymentCallback(accessToken, paymentId, true);
      const data = await poll();
      if (data?.status === "COMPLETED") {
        router.replace(`/payments/success?payment=${paymentId}`);
      } else {
        setPayment(data);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Demo completion failed.");
    } finally {
      setSimulating(false);
    }
  }

  if (authLoading || (loading && !payment)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-ustawi-navy/40" />
        <p className="mt-4 text-sm text-ustawi-muted">Waiting for M-Pesa confirmation…</p>
      </div>
    );
  }

  const processing = payment?.status === "PROCESSING" || payment?.status === "PENDING";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-6 text-center shadow-sm sm:p-8">
        {processing ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Smartphone className="h-8 w-8 animate-pulse text-blue-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ustawi-navy">Check your phone</h2>
            <p className="mt-2 text-sm text-ustawi-muted">
              {isDemo
                ? "Demo mode: payment completes automatically — no M-Pesa PIN needed."
                : "Enter your M-Pesa PIN on the STK push prompt to complete rent payment."}
            </p>
          </>
        ) : payment?.status === "FAILED" ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-xl font-bold text-ustawi-navy">Payment failed</h2>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-ustawi-navy">Payment confirmed</h2>
          </>
        )}

        {payment && (
          <dl className="mt-6 space-y-2 rounded-xl bg-[#F7F8FC] p-4 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ustawi-muted">Property</dt>
              <dd className="font-medium text-ustawi-navy">{payment.property_title}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ustawi-muted">Amount</dt>
              <dd className="font-bold text-ustawi-navy">{formatPrice(payment.amount, payment.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ustawi-muted">Invoice</dt>
              <dd className="font-mono text-xs">{payment.invoice_number}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ustawi-muted">Status</dt>
              <dd className="capitalize">{payment.status.toLowerCase()}</dd>
            </div>
          </dl>
        )}

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        {processing && (
          <p className="mt-4 text-xs text-ustawi-muted">Checking status… ({pollCount}/{MAX_POLLS})</p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {(processing || error) && (
            <Button
              type="button"
              variant="outline"
              disabled={simulating}
              className="rounded-xl"
              onClick={handleDemoComplete}
            >
              {simulating ? "Completing…" : "Complete demo payment (skip PIN)"}
            </Button>
          )}
          <Link href="/payments">
            <Button type="button" variant="ghost" className="w-full rounded-xl sm:w-auto">
              Back to billing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
