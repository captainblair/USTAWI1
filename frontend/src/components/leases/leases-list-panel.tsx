"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Home, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { LeaseStatusFilterTabs } from "@/components/leases/lease-status-filter-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchMyLeases } from "@/lib/api/leases";
import { isTenant } from "@/lib/auth/constants";
import { formatLeaseDate } from "@/lib/leases/status";
import { formatPrice, cn } from "@/lib/utils";
import type { LeaseListItem } from "@/types/lease";
import { ApiRequestError } from "@/types/api";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_SIGNATURE", label: "Pending" },
  { value: "EXPIRING_SOON", label: "Expiring" },
  { value: "EXPIRED", label: "Expired" },
];

function needsTenantSign(lease: LeaseListItem) {
  return lease.effective_status === "PENDING_SIGNATURE" && !lease.signature_status.tenant_signed;
}

export function LeasesListPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [allItems, setAllItems] = useState<LeaseListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/leases");
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
        const data = await fetchMyLeases(accessToken!);
        if (!cancelled) {
          setAllItems(data.results);
          setCount(data.count);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load leases.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router, user]);

  const items = useMemo(
    () => (statusFilter ? allItems.filter((l) => l.effective_status === statusFilter) : allItems),
    [allItems, statusFilter],
  );

  const tabsWithCounts = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        ...tab,
        count: tab.value ? allItems.filter((l) => l.effective_status === tab.value).length : count,
      })),
    [allItems, count],
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <LeaseStatusFilterTabs tabs={tabsWithCounts} value={statusFilter} onChange={setStatusFilter} />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!error && allItems.length === 0 && (
        <div className="rounded-2xl border border-ustawi-border bg-white p-8 text-center sm:p-10">
          <FileText className="mx-auto h-10 w-10 text-ustawi-muted/50" />
          <p className="mt-4 font-semibold text-ustawi-navy">No leases yet</p>
          <p className="mt-1 text-sm text-ustawi-muted">
            When a landlord creates a lease from your approved application, it will appear here.
          </p>
          <Link
            href="/applications"
            className="mt-6 inline-flex rounded-full bg-ustawi-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-ustawi-navy/90"
          >
            View applications
          </Link>
        </div>
      )}

      {allItems.length > 0 && items.length === 0 && (
        <p className="rounded-xl border border-[#E8EAF2] bg-white px-4 py-6 text-center text-sm text-ustawi-muted">
          No leases match this filter.
        </p>
      )}

      {items.length > 0 && (
        <p className="text-xs text-ustawi-muted sm:text-sm">
          {statusFilter ? `${items.length} of ${count}` : count} lease{count === 1 ? "" : "s"}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((lease) => {
          const pending = needsTenantSign(lease);
          return (
            <li key={lease.id}>
              <Link
                href={`/leases/${lease.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition active:scale-[0.99] sm:gap-4 sm:p-5",
                  pending
                    ? "border-amber-200 ring-1 ring-amber-100 hover:border-amber-300"
                    : "border-ustawi-border hover:border-ustawi-navy/20 hover:shadow-md",
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EAF2] text-ustawi-navy sm:h-14 sm:w-14">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-bold leading-snug text-ustawi-navy">{lease.property_title}</p>
                    <LeaseStatusBadge status={lease.effective_status} compact />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ustawi-muted">{lease.property_address}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ustawi-navy sm:text-sm">
                    <span className="font-semibold">{formatPrice(lease.rent_amount, lease.currency)}/mo</span>
                    <span className="hidden text-ustawi-muted sm:inline">·</span>
                    <span className="text-ustawi-muted">
                      {formatLeaseDate(lease.start_date)} – {formatLeaseDate(lease.end_date)}
                    </span>
                  </div>
                  {pending && (
                    <p className="mt-1.5 text-xs font-semibold text-amber-800">Signature required</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-ustawi-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
