"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ApplicationStatusBadge,
  ScreeningScoreBadge,
} from "@/components/applications/application-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  fetchApplicationDetail,
  submitApplication,
  withdrawApplication,
} from "@/lib/api/applications";
import { isTenant } from "@/lib/auth/constants";
import { isEditableApplicationStatus } from "@/lib/applications/status";
import { propertyImageSrc } from "@/lib/media-url";
import { formatPrice } from "@/lib/utils";
import type { ApplicationDetail } from "@/types/application";
import { ApiRequestError } from "@/types/api";

export function ApplicationDetailPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/applications/${applicationId}`);
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
        const data = await fetchApplicationDetail(accessToken!, applicationId);
        if (!cancelled) setApplication(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load application.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, applicationId, authLoading, isAuthenticated, router, user]);

  async function handleSubmitDraft() {
    if (!accessToken || !application) return;
    setActionLoading(true);
    setError(null);
    try {
      await submitApplication(accessToken, application.id);
      router.push(`/applications/${application.id}/success`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not submit.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!accessToken || !application) return;
    setActionLoading(true);
    setError(null);
    try {
      await withdrawApplication(accessToken, application.id);
      const refreshed = await fetchApplicationDetail(accessToken, application.id);
      setApplication(refreshed);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not withdraw.");
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Application not found."}
      </div>
    );
  }

  const prop = application.property;
  const summary = application.summary;
  const verification = application.verification;
  const canEdit = isEditableApplicationStatus(application.status);
  const canWithdraw = ["SUBMITTED", "UNDER_REVIEW", "DRAFT"].includes(application.status);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <ApplicationStatusBadge status={application.status} />
            {application.status !== "DRAFT" && verification.screening_score > 0 && (
              <ScreeningScoreBadge score={verification.screening_score} label={verification.screening_label} />
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ustawi-navy">{summary.property_title}</h2>
          <p className="mt-1 text-ustawi-muted">{summary.property_location}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Move-in date</dt>
              <dd className="mt-1 font-medium text-ustawi-navy">
                {summary.move_in_date ? new Date(summary.move_in_date).toLocaleDateString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Monthly income</dt>
              <dd className="mt-1 font-medium text-ustawi-navy">
                KES {Number(summary.monthly_income).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Employment</dt>
              <dd className="mt-1 font-medium text-ustawi-navy">
                {verification.employment_title || "—"}
                {verification.employer && ` at ${verification.employer}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Income vs rent</dt>
              <dd className="mt-1 font-medium text-ustawi-navy">{verification.income_vs_rent_summary || "—"}</dd>
            </div>
          </dl>

          {summary.cover_letter && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-ustawi-navy">Cover letter</h3>
              <p className="mt-2 text-sm leading-relaxed text-ustawi-muted whitespace-pre-line">
                {summary.cover_letter}
              </p>
            </div>
          )}

          {application.rejection_reason && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <XCircle className="h-4 w-4" />
                Rejection reason
              </p>
              <p className="mt-2 text-sm text-red-700">{application.rejection_reason}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-ustawi-navy">Documents</h3>
          {verification.documents.length > 0 ? (
            <ul className="mt-4 divide-y divide-ustawi-border">
              {verification.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3 first:pt-0">
                  <span className="text-sm text-ustawi-navy">{doc.title || doc.doc_type}</span>
                  <a
                    href={doc.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-ustawi-red hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ustawi-muted">No documents uploaded yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-ustawi-navy">Timeline</h3>
          <ul className="mt-6 space-y-4">
            {application.timeline.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ustawi-cream text-ustawi-navy">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ustawi-navy capitalize">
                    {event.event_type.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <p className="text-sm text-ustawi-muted">{event.message}</p>
                  <p className="mt-0.5 text-xs text-ustawi-muted">
                    {new Date(event.created_at).toLocaleString()} · {event.actor_name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-ustawi-border bg-white shadow-sm">
          <div className="relative aspect-[4/3] bg-ustawi-sand">
            <Image
              src={propertyImageSrc(prop.primary_image)}
              alt={prop.title}
              fill
              className="object-cover"
              sizes="340px"
            />
          </div>
          <div className="p-5">
            <p className="font-bold text-ustawi-navy">{formatPrice(prop.price_monthly, prop.currency)}/mo</p>
            <Link
              href={`/properties/${prop.slug}`}
              className="mt-2 inline-block text-sm font-semibold text-ustawi-red hover:underline"
            >
              View property
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-ustawi-border bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold text-ustawi-navy">Verification checks</h4>
          <ul className="mt-3 space-y-2 text-sm text-ustawi-muted">
            <li className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${verification.verified_phone ? "text-emerald-600" : "text-ustawi-muted/40"}`} />
              Phone verified
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${verification.verified_id ? "text-emerald-600" : "text-ustawi-muted/40"}`} />
              ID verified
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${verification.verified_income ? "text-emerald-600" : "text-ustawi-muted/40"}`} />
              Income verified
            </li>
          </ul>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          {canEdit && (
            <>
              <Link href={`/properties/${prop.slug}/apply`}>
                <Button className="w-full">Continue draft</Button>
              </Link>
              <Button className="w-full" variant="secondary" disabled={actionLoading} onClick={handleSubmitDraft}>
                Submit application
              </Button>
            </>
          )}
          {canWithdraw && application.status !== "DRAFT" && (
            <Button className="w-full" variant="outline" disabled={actionLoading} onClick={handleWithdraw}>
              Withdraw application
            </Button>
          )}
          <Link href="/applications">
            <Button className="w-full" variant="outline">
              All applications
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
