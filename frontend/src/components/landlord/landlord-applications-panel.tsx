"use client";

import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  approveLandlordApplication,
  fetchLandlordApplications,
  rejectLandlordApplication,
  reviewLandlordApplication,
} from "@/lib/api/landlord-applications";
import { isLandlord } from "@/lib/auth/constants";
import type { LandlordApplicationInboxItem } from "@/types/landlord";
import { ApiRequestError } from "@/types/api";

export function LandlordApplicationsPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<LandlordApplicationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    if (!accessToken) return;
    const data = await fetchLandlordApplications(accessToken);
    setItems(data.results);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/applications");
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
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load applications.");
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

  async function handleApprove(id: string) {
    if (!accessToken) return;
    setActionId(id);
    setMessage(null);
    try {
      const result = await approveLandlordApplication(accessToken, id);
      await load();
      setMessage(
        result.lease_id
          ? "Application approved and lease created for signatures."
          : "Application approved.",
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not approve.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    if (!accessToken) return;
    setActionId(id);
    try {
      await rejectLandlordApplication(accessToken, id, "Not selected at this time.");
      await load();
      setMessage("Application rejected.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reject.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReview(id: string) {
    if (!accessToken) return;
    setActionId(id);
    try {
      await reviewLandlordApplication(accessToken, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update status.");
    } finally {
      setActionId(null);
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
    <div>
      {message && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
          <p className="font-semibold text-ustawi-navy">No applications yet</p>
          <p className="mt-1 text-sm text-ustawi-muted">Applications appear when tenants apply to your active listings.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((app) => (
            <li key={app.id} className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ustawi-navy">{app.tenant_name}</p>
                  <p className="text-sm text-ustawi-muted">{app.property_title} · {app.property_location}</p>
                  {app.screening_score != null && (
                    <p className="mt-1 text-sm text-ustawi-navy">
                      Screening score: <span className="font-semibold">{app.screening_score}</span>
                      {app.screening_label ? ` (${app.screening_label})` : ""}
                    </p>
                  )}
                </div>
                <ApplicationStatusBadge status={app.status as never} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["SUBMITTED", "UNDER_REVIEW"].includes(app.status) && (
                  <>
                    {app.status === "SUBMITTED" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionId === app.id}
                        onClick={() => handleReview(app.id)}
                      >
                        Mark under review
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId === app.id}
                      onClick={() => handleApprove(app.id)}
                    >
                      <Check className="h-4 w-4" />
                      Approve & create lease
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionId === app.id}
                      onClick={() => handleReject(app.id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
