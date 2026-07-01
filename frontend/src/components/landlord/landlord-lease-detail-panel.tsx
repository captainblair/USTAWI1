"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LeaseDocumentsPanel } from "@/components/leases/lease-documents-panel";
import { LeaseSignBanner } from "@/components/leases/lease-sign-banner";
import { LeaseSummarySidebar } from "@/components/leases/lease-summary-sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordLeaseDetail, signLandlordLease } from "@/lib/api/landlord-leases";
import { isLandlord } from "@/lib/auth/constants";
import { resolveLeaseDocUrl } from "@/lib/leases/documents";
import { formatLeaseDate, isSignableLease } from "@/lib/leases/status";
import { formatPrice, cn } from "@/lib/utils";
import type { LeaseDetail } from "@/types/lease";
import { ApiRequestError } from "@/types/api";

export function LandlordLeaseDetailPanel({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadLease = useCallback(async () => {
    if (!accessToken) return;
    const detail = await fetchLandlordLeaseDetail(accessToken, leaseId);
    setLease(detail);
    return detail;
  }, [accessToken, leaseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/landlord/leases/${leaseId}`);
      return;
    }
    if (!isLandlord(user)) {
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
      await signLandlordLease(accessToken, lease.id);
      const updated = await loadLease();
      if (updated?.effective_status === "ACTIVE") {
        setActionMessage("Lease signed and now active.");
      } else {
        setActionMessage("Your signature was recorded. Waiting for tenant signature.");
      }
      setAcceptedTerms(false);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Could not sign lease.");
    } finally {
      setSigning(false);
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
        <Link
          href="/landlord/leases"
          className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline"
        >
          Back to leases
        </Link>
      </div>
    );
  }

  const status = lease.effective_status;
  const canSign = isSignableLease(status) && !lease.signature_status.landlord_signed;
  const monthsLeft = lease.renewal_reminder.days_until_end;
  const monthsRemaining = Math.max(Math.round(monthsLeft / 30), 0);

  const keyTerms = [
    { label: `${lease.duration_months}-month lease` },
    { label: lease.furnished ? "Furnished" : "Unfurnished" },
    { label: `Rent due on day ${lease.rent_due_day} of each month` },
  ];

  return (
    <div className="-mx-4 -mt-2 sm:mx-0 sm:mt-0">
      <Link
        href="/landlord/leases"
        className="mb-4 inline-flex items-center gap-1.5 px-4 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy sm:mb-6 sm:px-0"
      >
        <ArrowLeft className="h-4 w-4" />
        All leases
      </Link>

      <div className="flex flex-col gap-5 px-4 sm:px-0 lg:grid lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
        <div className={cn("space-y-4 sm:space-y-5", canSign && "order-2 lg:order-1")}>
          <LeaseSummarySidebar
            lease={lease}
            status={status}
            rows={[
              { label: "Tenant", value: lease.tenant_name || lease.counterparty_name },
              {
                label: "Lease dates",
                value: `${formatLeaseDate(lease.start_date)} – ${formatLeaseDate(lease.end_date)}`,
              },
              { label: "Monthly rent", value: formatPrice(lease.rent_amount, lease.currency), highlight: true },
              { label: "Deposit", value: formatPrice(lease.deposit_amount, lease.currency) },
            ]}
            keyTerms={keyTerms}
          />
        </div>

        <div className={cn("space-y-4 sm:space-y-5", canSign && "order-1 lg:order-2")}>
          {canSign && (
            <LeaseSignBanner
              title="Review and sign the lease"
              description="Read the lease agreement below. Once you accept the terms and sign, the tenant can complete their signature to activate the lease."
              checkboxLabel="I have read and accept the lease terms on behalf of the property owner."
              buttonLabel="Sign as landlord"
              acceptedTerms={acceptedTerms}
              onAcceptedChange={setAcceptedTerms}
              onSign={handleSign}
              signing={signing}
              hint={
                lease.signature_status.tenant_signed && !lease.signature_status.landlord_signed
                  ? "Tenant has already signed — your signature will activate the lease."
                  : undefined
              }
            />
          )}

          {!canSign && status === "PENDING_SIGNATURE" && lease.signature_status.landlord_signed && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-900 sm:px-5 sm:py-4">
              You signed on {formatLeaseDate(lease.signature_status.landlord_signed_at!)}. Waiting for tenant
              signature.
            </div>
          )}

          <LeaseDocumentsPanel
            lease={lease}
            status={status}
            monthsRemaining={monthsRemaining}
            counterpartyLabel="Tenant"
            counterpartyName={lease.tenant_name || lease.counterparty_name}
            onDownload={() => {
              const url = resolveLeaseDocUrl(lease.signed_pdf_url ?? lease.documents[0]?.file_url ?? null);
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
          />

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
