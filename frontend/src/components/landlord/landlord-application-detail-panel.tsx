"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Clock, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  ApplicationStatusBadge,
  ScreeningScoreBadge,
} from "@/components/applications/application-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  approveLandlordApplication,
  fetchLandlordApplicationDetail,
  rejectLandlordApplication,
  reviewLandlordApplication,
} from "@/lib/api/landlord-applications";
import { isLandlord } from "@/lib/auth/constants";
import { propertyImageSrc } from "@/lib/media-url";
import { formatPrice } from "@/lib/utils";
import type { ApplicationDetail } from "@/types/application";
import { ApiRequestError } from "@/types/api";

export function LandlordApplicationDetailPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchLandlordApplicationDetail(accessToken, applicationId);
    setApplication(data);
  }, [accessToken, applicationId]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/landlord/applications/${applicationId}`);
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
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load application.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, applicationId, authLoading, isAuthenticated, load, router, user]);

  async function handleReview() {
    if (!accessToken) return;
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      await reviewLandlordApplication(accessToken, applicationId);
      await load();
      setMessage("Application marked as under review.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update status.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!accessToken) return;
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await approveLandlordApplication(accessToken, applicationId);
      await load();
      setMessage(
        result.lease_id
          ? "Application approved and lease created for signatures."
          : "Application approved.",
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not approve.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!accessToken) return;
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      await rejectLandlordApplication(accessToken, applicationId, "Not selected at this time.");
      await load();
      setMessage("Application rejected.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reject.");
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
  const canAct = ["SUBMITTED", "UNDER_REVIEW"].includes(application.status);

  return (
    <div className="space-y-6">
      <Link
        href="/landlord/applications"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ustawi-navy hover:text-ustawi-red"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applications
      </Link>

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <ApplicationStatusBadge status={application.status} />
              {verification.screening_score > 0 && (
                <ScreeningScoreBadge
                  score={verification.screening_score}
                  label={verification.screening_label}
                />
              )}
            </div>

            <h2 className="mt-4 text-2xl font-bold text-ustawi-navy">{summary.tenant_name}</h2>
            <p className="mt-1 text-ustawi-muted">{summary.tenant_email}</p>
            <p className="mt-2 text-sm text-ustawi-muted">
              Applying for <strong className="text-ustawi-navy">{summary.property_title}</strong> ·{" "}
              {summary.property_location}
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                  Move-in date
                </dt>
                <dd className="mt-1 font-medium text-ustawi-navy">
                  {summary.move_in_date
                    ? new Date(summary.move_in_date).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                  Monthly income
                </dt>
                <dd className="mt-1 font-medium text-ustawi-navy">
                  KES {Number(summary.monthly_income).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                  Employment
                </dt>
                <dd className="mt-1 font-medium text-ustawi-navy">
                  {verification.employment_title || "—"}
                  {verification.employer && ` at ${verification.employer}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">
                  Income vs rent
                </dt>
                <dd className="mt-1 font-medium text-ustawi-navy">
                  {verification.income_vs_rent_summary || "—"}
                </dd>
              </div>
            </dl>

            {summary.cover_letter && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-ustawi-navy">Cover letter</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ustawi-muted">
                  {summary.cover_letter}
                </p>
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
              <p className="mt-2 text-sm text-ustawi-muted">No documents uploaded.</p>
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
                    <p className="text-sm font-semibold capitalize text-ustawi-navy">
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
              <p className="font-bold text-ustawi-navy">{prop.title}</p>
              <p className="mt-1 text-sm text-ustawi-muted">{summary.property_location}</p>
              <p className="mt-2 font-bold text-ustawi-navy">
                {formatPrice(prop.price_monthly, prop.currency)}/mo
              </p>
              <Link
                href={`/properties/${prop.slug}`}
                className="mt-2 inline-block text-sm font-semibold text-ustawi-red hover:underline"
              >
                View listing
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-ustawi-border bg-white p-5 shadow-sm">
            <h4 className="text-sm font-bold text-ustawi-navy">Verification checks</h4>
            <ul className="mt-3 space-y-2 text-sm text-ustawi-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${verification.verified_phone ? "text-emerald-600" : "text-ustawi-muted/40"}`}
                />
                Phone verified
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${verification.verified_id ? "text-emerald-600" : "text-ustawi-muted/40"}`}
                />
                ID verified
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${verification.verified_income ? "text-emerald-600" : "text-ustawi-muted/40"}`}
                />
                Income verified
              </li>
            </ul>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {canAct && (
            <div className="flex flex-col gap-2">
              {application.status === "SUBMITTED" && (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={handleReview}
                >
                  Mark under review
                </Button>
              )}
              <Button className="w-full" disabled={actionLoading} onClick={handleApprove}>
                <Check className="h-4 w-4" />
                Approve & create lease
              </Button>
              <Button className="w-full" variant="outline" disabled={actionLoading} onClick={handleReject}>
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
