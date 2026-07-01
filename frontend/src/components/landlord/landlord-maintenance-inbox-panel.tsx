"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, Loader2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { LeaseStatusFilterTabs } from "@/components/leases/lease-status-filter-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordMaintenanceRequests } from "@/lib/api/landlord-maintenance";
import { isLandlord } from "@/lib/auth/constants";
import {
  categoryLabel,
  formatMaintenanceDate,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_URGENCIES,
  urgencyLabel,
} from "@/lib/maintenance/status";
import type { LandlordMaintenanceListItem } from "@/types/maintenance";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

export function LandlordMaintenanceInboxPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<LandlordMaintenanceListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/maintenance");
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
        const data = await fetchLandlordMaintenanceRequests(accessToken!);
        if (!cancelled) setItems(data.results);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load inbox.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router, user]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (urgencyFilter && item.urgency !== urgencyFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      return true;
    });
  }, [items, statusFilter, urgencyFilter, categoryFilter]);

  const statusTabs = useMemo(
    () =>
      ["", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((value) => ({
        value,
        label: value ? MAINTENANCE_STATUS_META[value as keyof typeof MAINTENANCE_STATUS_META].label : "All",
        count: value ? items.filter((r) => r.status === value).length : items.length,
      })),
    [items],
  );

  const pendingCount = items.filter((i) => i.status === "PENDING").length;

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{pendingCount}</strong> request{pendingCount === 1 ? "" : "s"} awaiting triage.
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <LeaseStatusFilterTabs tabs={statusTabs} value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="h-10 w-full min-w-0 rounded-lg border border-[#E8EAF2] bg-white px-3 text-sm text-ustawi-navy"
        >
          <option value="">All urgency</option>
          {MAINTENANCE_URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 w-full min-w-0 rounded-lg border border-[#E8EAF2] bg-white px-3 text-sm text-ustawi-navy"
        >
          <option value="">All categories</option>
          {MAINTENANCE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
          <Wrench className="mx-auto h-10 w-10 text-ustawi-muted/40" />
          <p className="mt-3 font-semibold text-ustawi-navy">No maintenance requests</p>
          <p className="mt-1 text-sm text-ustawi-muted">Tenant requests for your properties will appear here.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EAF2] bg-[#F7F8FC] text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                  <th className="px-5 py-3.5">Issue</th>
                  <th className="px-5 py-3.5">Tenant</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Urgency</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAF2]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAFBFE]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ustawi-navy">{item.title}</p>
                      <p className="text-xs text-ustawi-muted">{item.property_title}</p>
                    </td>
                    <td className="px-5 py-4">{item.tenant_name}</td>
                    <td className="px-5 py-4">{categoryLabel(item.category)}</td>
                    <td className="px-5 py-4">{urgencyLabel(item.urgency)}</td>
                    <td className="px-5 py-4">
                      <MaintenanceStatusBadge status={item.status} compact />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/landlord/maintenance/${item.id}`}
                        className="inline-flex rounded-lg border border-[#E8EAF2] px-4 py-2 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
                      >
                        Triage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/landlord/maintenance/${item.id}`}
                  className={cn(
                    "block rounded-2xl border bg-white p-4 shadow-sm",
                    item.status === "PENDING" && "border-amber-200 ring-1 ring-amber-100",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-ustawi-navy">{item.title}</p>
                      <p className="text-sm text-ustawi-muted">
                        {item.tenant_name} · {item.property_title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-ustawi-muted">
                        <Clock className="h-3.5 w-3.5" />
                        {formatMaintenanceDate(item.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ustawi-muted" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <MaintenanceStatusBadge status={item.status} compact />
                    <span className="rounded-full bg-[#F7F8FC] px-2 py-0.5 text-xs font-medium text-ustawi-navy">
                      {urgencyLabel(item.urgency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
