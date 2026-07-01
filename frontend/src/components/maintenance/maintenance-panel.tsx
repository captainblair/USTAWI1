"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, Loader2, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MaintenancePhotoUpload } from "@/components/maintenance/maintenance-photo-upload";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchMyLeases } from "@/lib/api/leases";
import { createMaintenanceRequest, fetchMyMaintenanceRequests } from "@/lib/api/maintenance";
import { isTenant } from "@/lib/auth/constants";
import {
  categoryLabel,
  formatMaintenanceDate,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_URGENCIES,
} from "@/lib/maintenance/status";
import type { MaintenanceCategory, MaintenanceListItem, MaintenanceUrgency } from "@/types/maintenance";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";
import { LeaseStatusFilterTabs } from "@/components/leases/lease-status-filter-tabs";

export function MaintenancePanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<MaintenanceListItem[]>([]);
  const [activeLeases, setActiveLeases] = useState<{ id: string; label: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [leaseId, setLeaseId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("PLUMBING");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<MaintenanceUrgency>("MEDIUM");
  const [photos, setPhotos] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [maintenance, leases] = await Promise.all([
      fetchMyMaintenanceRequests(accessToken),
      fetchMyLeases(accessToken),
    ]);
    setRequests(maintenance.results);
    const eligible = leases.results.filter(
      (l) => l.effective_status === "ACTIVE" || l.effective_status === "EXPIRING_SOON",
    );
    setActiveLeases(
      eligible.map((l) => ({
        id: l.id,
        label: `${l.property_title}${l.property_address ? ` — ${l.property_address}` : ""}`,
      })),
    );
    if (eligible.length && !leaseId) setLeaseId(eligible[0].id);
  }, [accessToken, leaseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/maintenance");
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
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load maintenance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router, user]);

  const filtered = useMemo(
    () => (statusFilter ? requests.filter((r) => r.status === statusFilter) : requests),
    [requests, statusFilter],
  );

  const statusTabs = useMemo(
    () =>
      ["", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((value) => ({
        value,
        label: value ? MAINTENANCE_STATUS_META[value as keyof typeof MAINTENANCE_STATUS_META].label : "All",
        count: value ? requests.filter((r) => r.status === value).length : requests.length,
      })),
    [requests],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !leaseId) return;
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      const created = await createMaintenanceRequest(accessToken, {
        lease_id: leaseId,
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        photos,
      });
      setTitle("");
      setDescription("");
      setPhotos([]);
      setUrgency("MEDIUM");
      setSuccess("Maintenance request submitted.");
      await load();
      router.push(`/maintenance/${created.id}`);
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
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
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-8">
      {/* Your requests — first on mobile per wireframe */}
      <div className="order-1 min-w-0 lg:order-2">
        <h2 className="text-lg font-bold text-ustawi-navy">Your Requests</h2>
        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <LeaseStatusFilterTabs tabs={statusTabs} value={statusFilter} onChange={setStatusFilter} />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[#E8EAF2] bg-white p-8 text-center">
            <Wrench className="mx-auto h-10 w-10 text-ustawi-muted/40" />
            <p className="mt-3 font-semibold text-ustawi-navy">No requests yet</p>
            <p className="mt-1 text-sm text-ustawi-muted">Submit a maintenance issue using the form below.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((req) => {
              const meta = MAINTENANCE_STATUS_META[req.status];
              const statusHint =
                req.status === "RESOLVED" && req.assigned_technician_name
                  ? `Technician ${req.assigned_technician_name} confirmed fix`
                  : req.status === "ASSIGNED" || req.status === "IN_PROGRESS"
                    ? req.assigned_technician_name
                      ? `Technician ${req.assigned_technician_name} assigned`
                      : "Technician assigned"
                    : req.status === "PENDING"
                      ? "Awaiting technician assignment"
                      : meta.summaryLabel ?? meta.label;

              return (
                <li key={req.id}>
                  <Link
                    href={`/maintenance/${req.id}`}
                    className="block rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm transition hover:border-ustawi-navy/20 active:scale-[0.99] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-bold leading-snug text-ustawi-navy">{req.title}</p>
                          <MaintenanceStatusBadge status={req.status} compact />
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-ustawi-muted">
                          {req.property_title}
                          {req.unit_label ? ` — ${req.unit_label}` : ""}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ustawi-muted">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatMaintenanceDate(req.created_at)} · {categoryLabel(req.category)}
                        </p>
                        <p className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-ustawi-navy">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dotClass)} />
                          <span className="min-w-0 break-words">{statusHint}</span>
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-ustawi-muted" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Submit form — below list on mobile */}
      <div className="order-2 min-w-0 lg:order-1">
        <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-ustawi-navy">Submit New Request</h2>

          {activeLeases.length === 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You need an active lease to report maintenance.{" "}
              <Link href="/leases" className="font-semibold underline">
                View your leases
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-ustawi-navy">Issue title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Leaky faucet in bathroom"
                  className="mt-1.5 h-11 w-full min-w-0 max-w-full rounded-lg border border-[#E8EAF2] px-3 text-sm outline-none focus:border-ustawi-navy/40"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ustawi-navy">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                  className="mt-1.5 h-11 w-full min-w-0 max-w-full rounded-lg border border-[#E8EAF2] bg-white px-3 text-sm outline-none focus:border-ustawi-navy/40"
                >
                  {MAINTENANCE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-ustawi-navy">Property &amp; unit</label>
                <select
                  required
                  value={leaseId}
                  onChange={(e) => setLeaseId(e.target.value)}
                  className="mt-1.5 h-11 w-full min-w-0 max-w-full rounded-lg border border-[#E8EAF2] bg-white px-3 text-sm outline-none focus:border-ustawi-navy/40"
                >
                  {activeLeases.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-ustawi-navy">Detailed description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  className="mt-1.5 w-full min-w-0 max-w-full rounded-lg border border-[#E8EAF2] px-3 py-2.5 text-sm outline-none focus:border-ustawi-navy/40"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ustawi-navy">Urgency level</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {MAINTENANCE_URGENCIES.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-xs font-semibold transition sm:text-sm",
                        urgency === u.value
                          ? "border-ustawi-navy bg-ustawi-navy text-white"
                          : "border-[#E8EAF2] bg-white text-ustawi-navy hover:bg-ustawi-cream",
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <MaintenancePhotoUpload files={photos} onChange={setPhotos} disabled={submitting} />

              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}
              {success && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {success}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-xl bg-[#EF3D32] text-base font-bold hover:bg-[#EF3D32]/90"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
