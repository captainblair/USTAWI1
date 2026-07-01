"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordCollectedPayments, fetchLandlordPaymentSummary } from "@/lib/api/payments";
import { isLandlord } from "@/lib/auth/constants";
import { formatPaymentDate, PAYMENT_STATUS_META } from "@/lib/payments/status";
import type { LandlordCollectedPayment, LandlordIncomeSummary } from "@/types/payment";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-[#1F2B6C] p-5 text-white shadow-sm">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/55">{hint}</p>}
    </div>
  );
}

export function LandlordPaymentsPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<LandlordIncomeSummary | null>(null);
  const [payments, setPayments] = useState<LandlordCollectedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [sum, collected] = await Promise.all([
      fetchLandlordPaymentSummary(accessToken),
      fetchLandlordCollectedPayments(accessToken),
    ]);
    setSummary(sum);
    setPayments(collected.results);
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/payments");
      return;
    }
    if (!isLandlord(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load payments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error || !summary) {
    return <p className="text-sm text-red-700">{error ?? "Payments unavailable."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Collected this month"
          value={formatPrice(summary.total_collected, summary.currency)}
          hint={summary.month}
        />
        <SummaryCard label="Payments received" value={String(summary.payment_count)} hint="Completed M-Pesa" />
        <SummaryCard label="Pending invoices" value={String(summary.pending_invoices)} />
        <SummaryCard label="Overdue invoices" value={String(summary.overdue_invoices)} />
      </div>

      <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-bold text-ustawi-navy">Collected payments</h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-ustawi-muted">No rent payments collected yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EAF2] text-xs uppercase tracking-wide text-ustawi-muted">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Tenant</th>
                  <th className="pb-2 pr-3">Property</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">M-Pesa ref</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const meta = PAYMENT_STATUS_META[p.status];
                  return (
                    <tr key={p.id} className="border-b border-[#E8EAF2] last:border-0">
                      <td className="py-3 pr-3">{formatPaymentDate(p.completed_at ?? p.created_at)}</td>
                      <td className="py-3 pr-3">{p.tenant_name}</td>
                      <td className="py-3 pr-3">{p.property_title}</td>
                      <td className="py-3 pr-3">{formatPrice(p.amount, p.currency)}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{p.mpesa_receipt_number ?? "—"}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
