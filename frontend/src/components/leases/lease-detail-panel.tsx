"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LeaseDocumentsPanel } from "@/components/leases/lease-documents-panel";
import { LeaseSignBanner } from "@/components/leases/lease-sign-banner";
import { LeaseSummarySidebar } from "@/components/leases/lease-summary-sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { PayPalPayButton } from "@/components/payments/paypal-pay-button";
import { Button } from "@/components/ui/button";
import { fetchLeaseDetail, signLease } from "@/lib/api/leases";
import { fetchPaymentHistory } from "@/lib/api/payments";
import { isTenant } from "@/lib/auth/constants";
import {
  formatLeaseDate,
  isActiveLeaseStatus,
  isSignableLease,
} from "@/lib/leases/status";
import { formatPrice, cn } from "@/lib/utils";
import type { LeaseDetail } from "@/types/lease";
import type { PaymentHistoryItem } from "@/types/payment";
import { ApiRequestError } from "@/types/api";

export function LeaseDetailPanel({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadLease = useCallback(async () => {
    if (!accessToken) return;
    const [detail, history] = await Promise.all([
      fetchLeaseDetail(accessToken, leaseId),
      fetchPaymentHistory(accessToken).catch(() => ({ results: [] as PaymentHistoryItem[] })),
    ]);
    setLease(detail);
    setPayments(
      history.results.filter((p) => p.property_title === detail.property_title && p.status === "COMPLETED"),
    );
    return detail;
  }, [accessToken, leaseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/leases/${leaseId}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        await loadLease();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load lease.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, leaseId, loadLease, router, user]);

  async function handleSign() {
    if (!accessToken || !lease || !acceptedTerms) return;
    setSigning(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await signLease(accessToken, lease.id);
      const updated = await loadLease();
      if (updated?.effective_status === "ACTIVE") {
        setActionMessage("Lease signed and now active.");
      } else {
        setActionMessage("Your signature was recorded. Waiting for landlord signature.");
      }
      setAcceptedTerms(false);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Could not sign lease.");
    } finally {
      setSigning(false);
    }
  }

  async function handlePayRent() {
    if (!accessToken || !lease) return;
    router.push(`/payments?lease=${lease.id}`);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: lease?.property_title ?? "Lease", url });
    } else {
      await navigator.clipboard.writeText(url);
      setActionMessage("Link copied to clipboard.");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16 sm:py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
        <p className="text-sm text-red-700">{error ?? "Lease unavailable."}</p>
        <Link href="/leases" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
          Back to leases
        </Link>
      </div>
    );
  }

  const status = lease.effective_status;
  const canSign = isSignableLease(status) && !lease.signature_status.tenant_signed;
  const monthsLeft = lease.renewal_reminder.days_until_end;
  const monthsRemaining = Math.max(Math.round(monthsLeft / 30), 0);
  const nextDue = lease.rent_due.due_date
    ? formatLeaseDate(lease.rent_due.due_date)
    : `Day ${lease.rent_due_day} each month`;

  const keyTerms = [
    { label: `${lease.duration_months}-month lease` },
    { label: lease.furnished ? "Furnished" : "Unfurnished" },
    { label: `Deposit ${formatPrice(lease.deposit_amount, lease.currency)}` },
    { label: `Rent due on day ${lease.rent_due_day} of each month` },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <Link
        href="/leases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All leases
      </Link>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
        {/* Sidebar — below documents on mobile when signing */}
        <div className={cn("space-y-4 sm:space-y-5", canSign && "order-2 lg:order-1")}>
          <LeaseSummarySidebar
            lease={lease}
            status={status}
            title="Active lease summary"
            rows={[
              {
                label: "Lease dates",
                value: `${formatLeaseDate(lease.start_date)} – ${formatLeaseDate(lease.end_date)}`,
              },
              { label: "Monthly rent", value: formatPrice(lease.rent_amount, lease.currency), highlight: true },
              { label: "Next due", value: nextDue },
            ]}
            payRentAction={
              isActiveLeaseStatus(status) && lease.rent_due.is_due ? (
                <div className="mt-4 space-y-3 border-t border-[#E8EAF2] pt-4 sm:mt-5">
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl bg-[#EF3D32] text-base font-bold hover:bg-[#EF3D32]/90"
                    onClick={handlePayRent}
                  >
                    M-Pesa Pay
                  </Button>
                  <PayPalPayButton />
                  <p className="text-center text-xs text-ustawi-muted">
                    M-Pesa for everyday rent · PayPal for larger payments
                  </p>
                </div>
              ) : undefined
            }
          />

          <div className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5 lg:hidden">
            <h2 className="text-sm font-bold text-ustawi-navy">Key terms</h2>
            <ul className="mt-3 space-y-2 text-sm text-ustawi-navy">
              {keyTerms.map((term) => (
                <li key={term.label} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {term.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-bold text-ustawi-navy">Payment history</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-ustawi-muted">No completed payments yet.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                {payments.slice(0, 6).map((payment) => (
                  <li key={payment.id} className="flex items-center gap-2.5 text-sm sm:gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ustawi-navy">
                      {formatLeaseDate(payment.completed_at ?? payment.created_at)} ·{" "}
                      {formatPrice(payment.amount, payment.currency)}
                    </span>
                    <span className="shrink-0 font-semibold text-emerald-700">Paid</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Documents & sign — first on mobile when signing */}
        <div className={cn("space-y-4 sm:space-y-5", canSign && "order-1 lg:order-2")}>
          {canSign && (
            <LeaseSignBanner
              title="Review and sign your lease"
              description="Read the lease agreement below, accept the terms, then sign electronically to activate once the landlord also signs."
              checkboxLabel="I have read and accept the lease terms, including rent amount, duration, and house rules."
              buttonLabel="Sign lease"
              acceptedTerms={acceptedTerms}
              onAcceptedChange={setAcceptedTerms}
              onSign={handleSign}
              signing={signing}
              hint={
                lease.signature_status.landlord_signed && !lease.signature_status.tenant_signed
                  ? "Landlord has already signed — your signature will activate the lease."
                  : undefined
              }
            />
          )}

          {!canSign && status === "PENDING_SIGNATURE" && lease.signature_status.tenant_signed && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-900 sm:px-5 sm:py-4">
              You signed on {formatLeaseDate(lease.signature_status.tenant_signed_at!)}. Waiting for landlord
              signature.
            </div>
          )}

          <LeaseDocumentsPanel
            lease={lease}
            accessToken={accessToken!}
            status={status}
            monthsRemaining={monthsRemaining}
            counterpartyLabel="Landlord contact"
            counterpartyName={lease.landlord_name || lease.counterparty_name}
            onShare={handleShare}
          />

          {lease.renewal_reminder.renewal_due_soon && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#E8EAF2] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-bold text-ustawi-navy">Renewal reminder</p>
                <p className="text-sm text-ustawi-muted">
                  Your lease ends {formatLeaseDate(lease.end_date)} ({lease.renewal_reminder.days_until_end} days left)
                </p>
              </div>
              <Link
                href="/profile"
                className="shrink-0 text-sm font-semibold text-ustawi-navy hover:underline"
              >
                Contact landlord
              </Link>
            </div>
          )}

          <div className="hidden rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm lg:block">
            <h2 className="text-sm font-bold text-ustawi-navy">Key terms</h2>
            <ul className="mt-3 space-y-2 text-sm text-ustawi-navy">
              {keyTerms.map((term) => (
                <li key={term.label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {term.label}
                </li>
              ))}
            </ul>
          </div>

          {actionMessage && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {actionMessage}
            </p>
          )}
          {actionError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
