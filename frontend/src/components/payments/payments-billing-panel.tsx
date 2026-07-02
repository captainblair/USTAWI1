"use client";

import Link from "next/link";
import { PayPalPayButton } from "@/components/payments/paypal-pay-button";
import { DownloadReceiptButton } from "@/components/payments/download-receipt-button";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Smartphone, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  fetchInvoices,
  fetchPaymentHistory,
  fetchRentDue,
  initiateRentPayment,
} from "@/lib/api/payments";
import { isTenant } from "@/lib/auth/constants";
import {
  formatPaymentDate,
  formatKenyanPhoneInput,
  INVOICE_STATUS_META,
  PAYMENT_STATUS_META,
} from "@/lib/payments/status";
import type { InvoiceListItem, PaymentHistoryItem, RentDueItem } from "@/types/payment";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

function DarkKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-[#1F2B6C] p-5 text-white shadow-sm">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/55">{hint}</p>}
    </div>
  );
}

export function PaymentsBillingPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLease = searchParams.get("lease");
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [rentDue, setRentDue] = useState<RentDueItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [invoiceTab, setInvoiceTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payLeaseId, setPayLeaseId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [due, inv, hist] = await Promise.all([
      fetchRentDue(accessToken),
      fetchInvoices(accessToken, invoiceTab || undefined),
      fetchPaymentHistory(accessToken),
    ]);
    setRentDue(due);
    setInvoices(inv.results);
    setHistory(hist.results);
  }, [accessToken, invoiceTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      const next = `/payments${preselectedLease ? `?lease=${preselectedLease}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load billing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router, user]);

  useEffect(() => {
    if (user?.phone) setPhone(formatKenyanPhoneInput(user.phone));
  }, [user?.phone]);

  useEffect(() => {
    if (preselectedLease && rentDue.some((r) => r.lease_id === preselectedLease)) {
      setPayLeaseId(preselectedLease);
    }
  }, [preselectedLease, rentDue]);

  const dueItems = rentDue.filter((r) => r.rent_due.is_due);
  const nextDue = dueItems[0];

  async function handlePayNow(leaseId: string) {
    if (!accessToken || !phone.trim()) {
      setPayError("Enter your M-Pesa phone number.");
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const result = await initiateRentPayment(accessToken, leaseId, phone);
      router.push(`/payments/confirm/${result.payment_id}${result.dev_mode ? "?demo=1" : ""}`);
    } catch (err) {
      setPayError(err instanceof ApiRequestError ? err.message : "Could not start payment.");
    } finally {
      setPaying(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <DarkKpi
          label="Upcoming rent"
          value={nextDue ? formatPrice(nextDue.rent_due.amount, nextDue.rent_due.currency) : "—"}
          hint={nextDue ? `${nextDue.property_title} · due ${formatPaymentDate(nextDue.rent_due.due_date)}` : "No rent due"}
        />
        <DarkKpi
          label="Open invoices"
          value={String(invoices.filter((i) => i.status !== "PAID").length)}
          hint={`${invoices.filter((i) => i.status === "OVERDUE").length} overdue`}
        />
        <DarkKpi
          label="Payments made"
          value={String(history.filter((h) => h.status === "COMPLETED").length)}
          hint="All time on Ustawi"
        />
      </div>

      {dueItems.length > 0 && (
        <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-ustawi-navy" />
            <h2 className="font-bold text-ustawi-navy">Pay rent now</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {dueItems.map((item) => (
              <li
                key={item.lease_id}
                className={cn(
                  "rounded-xl border p-4 transition",
                  payLeaseId === item.lease_id ? "border-ustawi-navy/30 bg-[#FAFBFE]" : "border-[#E8EAF2]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ustawi-navy">{item.property_title}</p>
                    <p className="text-sm text-ustawi-muted">
                      {formatPrice(item.rent_due.amount, item.rent_due.currency)} · Due{" "}
                      {formatPaymentDate(item.rent_due.due_date)}
                      {item.rent_due.days_overdue ? ` · ${item.rent_due.days_overdue}d overdue` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="rounded-xl bg-[#EF3D32] hover:bg-[#EF3D32]/90"
                    onClick={() => setPayLeaseId(item.lease_id)}
                  >
                    Pay now
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {payLeaseId && (
            <div className="mt-5 border-t border-[#E8EAF2] pt-5">
              <label className="flex items-center gap-2 text-sm font-medium text-ustawi-navy">
                <Smartphone className="h-4 w-4" />
                M-Pesa phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatKenyanPhoneInput(e.target.value))}
                placeholder="+254712345678"
                className="mt-2 w-full max-w-sm rounded-lg border border-[#E8EAF2] px-3 py-2.5 text-sm"
              />
              {payError && <p className="mt-2 text-sm text-red-700">{payError}</p>}
              <Button
                type="button"
                disabled={paying}
                className="mt-4 rounded-xl bg-ustawi-navy"
                onClick={() => handlePayNow(payLeaseId)}
              >
                {paying ? "Sending STK push…" : "Send M-Pesa STK push"}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8EAF2]" />
                </div>
                <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium uppercase tracking-wide text-ustawi-muted">
                  or
                </p>
              </div>
              <PayPalPayButton disabled={paying} />
              <p className="mt-2 text-xs text-ustawi-muted">PayPal Payments Coming soon!</p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-bold text-ustawi-navy">Invoices</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["", "PENDING", "OVERDUE", "PAID"].map((tab) => (
            <button
              key={tab || "all"}
              type="button"
              onClick={() => setInvoiceTab(tab)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                invoiceTab === tab
                  ? "border-ustawi-navy bg-ustawi-navy text-white"
                  : "border-[#E8EAF2] text-ustawi-navy hover:bg-ustawi-cream",
              )}
            >
              {tab ? INVOICE_STATUS_META[tab as keyof typeof INVOICE_STATUS_META].label : "All"}
            </button>
          ))}
        </div>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-ustawi-muted">No invoices yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EAF2] text-xs uppercase tracking-wide text-ustawi-muted">
                  <th className="pb-2 pr-3">Invoice</th>
                  <th className="pb-2 pr-3">Property</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Due</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const meta = INVOICE_STATUS_META[inv.status];
                  return (
                    <tr key={inv.id} className="border-b border-[#E8EAF2] last:border-0">
                      <td className="py-3 pr-3 font-medium text-ustawi-navy">{inv.invoice_number}</td>
                      <td className="py-3 pr-3 text-ustawi-muted">{inv.property_title}</td>
                      <td className="py-3 pr-3">{formatPrice(inv.amount, inv.currency)}</td>
                      <td className="py-3 pr-3">{formatPaymentDate(inv.due_date)}</td>
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

      <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-bold text-ustawi-navy">Payment history</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-ustawi-muted">No payments yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EAF2] text-xs uppercase tracking-wide text-ustawi-muted">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Property</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">M-Pesa ref</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => {
                  const meta = PAYMENT_STATUS_META[p.status];
                  return (
                    <tr key={p.id} className="border-b border-[#E8EAF2] last:border-0">
                      <td className="py-3 pr-3">{formatPaymentDate(p.completed_at ?? p.created_at)}</td>
                      <td className="py-3 pr-3">{p.property_title}</td>
                      <td className="py-3 pr-3">{formatPrice(p.amount, p.currency)}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{p.mpesa_receipt_number ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3">
                        {p.receipt_id ? (
                          <DownloadReceiptButton
                            receiptId={p.receipt_id}
                            receiptNumber={p.receipt_number}
                            variant="link"
                          />
                        ) : (
                          "—"
                        )}
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
