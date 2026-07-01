"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MaintenancePhotoGallery } from "@/components/maintenance/maintenance-photo-gallery";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchMaintenanceDetail } from "@/lib/api/maintenance";
import { isTenant } from "@/lib/auth/constants";
import { categoryLabel, formatMaintenanceDate, urgencyLabel } from "@/lib/maintenance/status";
import type { MaintenanceDetail } from "@/types/maintenance";
import { ApiRequestError } from "@/types/api";

export function MaintenanceDetailPanel({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchMaintenanceDetail(accessToken, requestId);
    setDetail(data);
  }, [accessToken, requestId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/maintenance/${requestId}`);
      return;
    }
    if (!isTenant(user)) {
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
        <Link href="/maintenance" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
          Back to maintenance
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-3xl">
      <Link
        href="/maintenance"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All requests
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-ustawi-navy sm:text-2xl">{detail.title}</h1>
            <p className="mt-1 break-words text-sm text-ustawi-muted">
              {detail.property_title}
              {detail.unit_label ? ` — ${detail.unit_label}` : ""}
            </p>
            <p className="mt-1 text-xs text-ustawi-muted">
              Submitted {formatMaintenanceDate(detail.created_at)} · {categoryLabel(detail.category)} ·{" "}
              {urgencyLabel(detail.urgency)} urgency
            </p>
          </div>
          <MaintenanceStatusBadge status={detail.status} className="self-start" />
        </div>

        <p className="mt-5 break-words text-sm leading-relaxed text-ustawi-navy">{detail.description}</p>

        {detail.assigned_technician_name && (
          <div className="mt-4 rounded-xl bg-[#F7F8FC] px-4 py-3 text-sm">
            <p className="font-semibold text-ustawi-navy">Assigned technician</p>
            <p className="text-ustawi-muted">
              {detail.assigned_technician_name}
              {detail.assigned_technician_phone ? ` · ${detail.assigned_technician_phone}` : ""}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-[#E8EAF2] pt-5">
          <h2 className="text-sm font-bold text-ustawi-navy">Photos</h2>
          <MaintenancePhotoGallery photos={detail.photos} className="mt-3" />
        </div>

        <div className="mt-6 border-t border-[#E8EAF2] pt-5">
          <h2 className="text-sm font-bold text-ustawi-navy">Status timeline</h2>
          <MaintenanceTimeline entries={detail.timeline} className="mt-4" />
        </div>
      </div>
    </div>
  );
}
