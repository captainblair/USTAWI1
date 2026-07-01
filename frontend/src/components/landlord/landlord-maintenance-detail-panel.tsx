"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MaintenancePhotoGallery } from "@/components/maintenance/maintenance-photo-gallery";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  assignMaintenanceTechnician,
  fetchLandlordMaintenanceDetail,
  updateMaintenanceStatus,
} from "@/lib/api/landlord-maintenance";
import { isLandlord } from "@/lib/auth/constants";
import {
  categoryLabel,
  formatMaintenanceDate,
  MAINTENANCE_STATUS_META,
  STATUS_TRANSITIONS,
  urgencyLabel,
} from "@/lib/maintenance/status";
import type { MaintenanceDetail, MaintenanceStatus } from "@/types/maintenance";
import { ApiRequestError } from "@/types/api";

export function LandlordMaintenanceDetailPanel({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [technicianName, setTechnicianName] = useState("");
  const [technicianPhone, setTechnicianPhone] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [newStatus, setNewStatus] = useState<MaintenanceStatus | "">("");
  const [statusMessage, setStatusMessage] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchLandlordMaintenanceDetail(accessToken, requestId);
    setDetail(data);
    setNewStatus("");
  }, [accessToken, requestId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/landlord/maintenance/${requestId}`);
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
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load request.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, requestId, router, user]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !technicianName.trim()) return;
    setAssigning(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await assignMaintenanceTechnician(accessToken, requestId, {
        technician_name: technicianName.trim(),
        technician_phone: technicianPhone.trim(),
        note: assignNote.trim(),
      });
      setActionMessage("Technician assigned.");
      setTechnicianName("");
      setTechnicianPhone("");
      setAssignNote("");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Could not assign technician.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !newStatus || !detail) return;
    setUpdating(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await updateMaintenanceStatus(accessToken, requestId, newStatus, statusMessage.trim());
      setActionMessage(`Status updated to ${MAINTENANCE_STATUS_META[newStatus].label}.`);
      setStatusMessage("");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Could not update status.");
    } finally {
      setUpdating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-700">{error ?? "Request not found."}</p>
        <Link
          href="/landlord/maintenance"
          className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline"
        >
          Back to inbox
        </Link>
      </div>
    );
  }

  const nextStatuses = STATUS_TRANSITIONS[detail.status];

  return (
    <div className="min-w-0">
      <Link
        href="/landlord/maintenance"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Maintenance inbox
      </Link>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_minmax(0,340px)] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words text-xl font-bold text-ustawi-navy">{detail.title}</h1>
                <p className="mt-1 break-words text-sm text-ustawi-muted">
                  {detail.property_title}
                  {detail.unit_label ? ` — ${detail.unit_label}` : ""}
                </p>
                <p className="mt-1 text-xs text-ustawi-muted">
                  {formatMaintenanceDate(detail.created_at)} · {categoryLabel(detail.category)} ·{" "}
                  {urgencyLabel(detail.urgency)} urgency
                </p>
              </div>
              <MaintenanceStatusBadge status={detail.status} className="self-start" />
            </div>
            <p className="mt-4 break-words text-sm leading-relaxed text-ustawi-navy">{detail.description}</p>

            <div className="mt-6 border-t border-[#E8EAF2] pt-5">
              <h2 className="text-sm font-bold text-ustawi-navy">Photos</h2>
              <MaintenancePhotoGallery photos={detail.photos} className="mt-3" />
            </div>

            <div className="mt-6 border-t border-[#E8EAF2] pt-5">
              <h2 className="text-sm font-bold text-ustawi-navy">Timeline</h2>
              <MaintenanceTimeline entries={detail.timeline} className="mt-4" />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {detail.status !== "CLOSED" && (
            <form
              onSubmit={handleAssign}
              className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="font-bold text-ustawi-navy">Assign technician</h2>
              <div className="mt-3 space-y-3">
                <input
                  required
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Technician name"
                  className="h-10 w-full rounded-lg border border-[#E8EAF2] px-3 text-sm outline-none focus:border-ustawi-navy/40"
                />
                <input
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="h-10 w-full rounded-lg border border-[#E8EAF2] px-3 text-sm outline-none focus:border-ustawi-navy/40"
                />
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Note for tenant (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm outline-none focus:border-ustawi-navy/40"
                />
                <Button type="submit" disabled={assigning} className="w-full rounded-xl bg-ustawi-navy">
                  {assigning ? "Assigning…" : "Assign technician"}
                </Button>
              </div>
            </form>
          )}

          {nextStatuses.length > 0 && (
            <form
              onSubmit={handleStatusUpdate}
              className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="font-bold text-ustawi-navy">Update status</h2>
              <div className="mt-3 space-y-3">
                <select
                  required
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
                  className="h-10 w-full rounded-lg border border-[#E8EAF2] bg-white px-3 text-sm"
                >
                  <option value="">Select new status</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {MAINTENANCE_STATUS_META[s].label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Message for tenant (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm outline-none"
                />
                <Button type="submit" disabled={updating || !newStatus} variant="outline" className="w-full">
                  {updating ? "Updating…" : "Update status"}
                </Button>
              </div>
            </form>
          )}

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
