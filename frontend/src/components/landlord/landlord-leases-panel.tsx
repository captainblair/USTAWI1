"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, FileText, Home, Loader2, PenLine, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { LeaseStatusFilterTabs } from "@/components/leases/lease-status-filter-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordLeases } from "@/lib/api/landlord-leases";
import { isLandlord } from "@/lib/auth/constants";
import { formatLeaseDate } from "@/lib/leases/status";
import { cn, formatPrice } from "@/lib/utils";
import type { LeaseListItem } from "@/types/lease";
import { ApiRequestError } from "@/types/api";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING_SIGNATURE", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING_SOON", label: "Expiring" },
  { value: "EXPIRED", label: "Expired" },
];

function needsLandlordSign(lease: LeaseListItem) {
  return lease.effective_status === "PENDING_SIGNATURE" && !lease.signature_status.landlord_signed;
}

export function LandlordLeasesPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<LeaseListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/leases");
      return;
    }
    if (!isLandlord(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLandlordLeases(accessToken!);
        if (!cancelled) setItems(data.results);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load leases.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router, user]);

  const filteredItems = useMemo(
    () => (statusFilter ? items.filter((l) => l.effective_status === statusFilter) : items),
    [items, statusFilter],
  );

  const stats = useMemo(() => {
    const pending = items.filter(needsLandlordSign).length;
    const active = items.filter(
      (l) => l.effective_status === "ACTIVE" || l.effective_status === "EXPIRING_SOON",
    ).length;
    return { total: items.length, pending, active };
  }, [items]);

  const tabsWithCounts = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        ...tab,
        count: tab.value ? items.filter((l) => l.effective_status === tab.value).length : items.length,
      })),
    [items],
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total leases", value: stats.total, icon: FileText },
          { label: "Awaiting your sign", value: stats.pending, icon: PenLine, accent: stats.pending > 0 },
          { label: "Active", value: stats.active, icon: Users },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4",
                stat.accent ? "border-amber-200 bg-amber-50/50" : "border-[#E8EAF2]",
              )}
            >
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.accent ? "text-amber-700" : "text-ustawi-muted")} />
              <p className="mt-2 text-lg font-bold text-ustawi-navy sm:text-2xl">{stat.value}</p>
              <p className="text-[10px] font-medium leading-tight text-ustawi-muted sm:text-xs">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <LeaseStatusFilterTabs tabs={tabsWithCounts} value={statusFilter} onChange={setStatusFilter} />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-8 text-center sm:p-10">
          <FileText className="mx-auto h-10 w-10 text-ustawi-muted/40" />
          <p className="mt-4 font-semibold text-ustawi-navy">No leases yet</p>
          <p className="mt-1 text-sm text-ustawi-muted">
            Approve a tenant application to create a lease for signing.
          </p>
          <Link
            href="/landlord/applications"
            className="mt-5 inline-flex rounded-lg bg-ustawi-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ustawi-navy/90"
          >
            View applications
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-8 text-center">
          <p className="text-sm text-ustawi-muted">No leases match this filter.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8EAF2] bg-[#F7F8FC] text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                    <th className="px-5 py-3.5">Property</th>
                    <th className="px-5 py-3.5">Tenant</th>
                    <th className="px-5 py-3.5">Rent</th>
                    <th className="px-5 py-3.5">Term</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EAF2]">
                  {filteredItems.map((lease) => {
                    const pending = needsLandlordSign(lease);
                    return (
                      <tr key={lease.id} className="transition hover:bg-[#FAFBFE]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EAF2]">
                              <Home className="h-5 w-5 text-ustawi-navy/60" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ustawi-navy">{lease.property_title}</p>
                              <p className="truncate text-xs text-ustawi-muted">{lease.property_address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-ustawi-navy">{lease.counterparty_name}</td>
                        <td className="px-5 py-4 font-semibold text-ustawi-navy">
                          {formatPrice(lease.rent_amount, lease.currency)}
                          <span className="text-xs font-normal text-ustawi-muted">/mo</span>
                        </td>
                        <td className="px-5 py-4 text-ustawi-muted">
                          {formatLeaseDate(lease.start_date)} – {formatLeaseDate(lease.end_date)}
                        </td>
                        <td className="px-5 py-4">
                          <LeaseStatusBadge status={lease.effective_status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/landlord/leases/${lease.id}`}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
                              pending
                                ? "bg-ustawi-navy text-white hover:bg-ustawi-navy/90"
                                : "border border-[#E8EAF2] text-ustawi-navy hover:bg-ustawi-cream",
                            )}
                          >
                            {pending ? (
                              <>
                                <PenLine className="h-4 w-4" />
                                Review & sign
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                View lease
                              </>
                            )}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 lg:hidden">
            {filteredItems.map((lease) => {
              const pending = needsLandlordSign(lease);
              return (
                <li key={lease.id}>
                  <Link
                    href={`/landlord/leases/${lease.id}`}
                    className={cn(
                      "block rounded-2xl border bg-white p-4 shadow-sm transition active:scale-[0.99] sm:p-5",
                      pending
                        ? "border-amber-200 ring-1 ring-amber-100"
                        : "border-[#E8EAF2] hover:border-ustawi-navy/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8EAF2]">
                        <Home className="h-6 w-6 text-ustawi-navy/70" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold leading-snug text-ustawi-navy">{lease.property_title}</p>
                          <LeaseStatusBadge status={lease.effective_status} compact />
                        </div>
                        <p className="mt-0.5 text-sm text-ustawi-muted">Tenant · {lease.counterparty_name}</p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ustawi-muted" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8EAF2] pt-3 text-sm">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ustawi-muted">Rent</p>
                        <p className="font-bold text-ustawi-navy">
                          {formatPrice(lease.rent_amount, lease.currency)}/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ustawi-muted">Term</p>
                        <p className="font-medium text-ustawi-navy">
                          {formatLeaseDate(lease.start_date)} – {formatLeaseDate(lease.end_date)}
                        </p>
                      </div>
                    </div>
                    {pending && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <PenLine className="h-3.5 w-3.5" />
                        Your signature required
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
