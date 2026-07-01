"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SafetyScoreForm } from "@/components/inspector/safety-score-form";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  approveVerificationCase,
  fetchVerificationCase,
  rejectVerificationCase,
  requestVerificationChanges,
  reviewVerificationDocument,
  reviewVerificationPhoto,
  startVerificationReview,
  submitSafetyScore,
} from "@/lib/api/inspector-verification";
import { isInspectorOrAdmin } from "@/lib/auth/constants";
import { propertyImageSrc } from "@/lib/media-url";
import {
  formatVerificationDate,
  VERIFICATION_STATUS_META,
} from "@/lib/verification/status";
import type { ReviewStatus, VerificationCaseDetail } from "@/types/verification";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

export function InspectorCaseDetailPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<VerificationCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [changesMessage, setChangesMessage] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchVerificationCase(accessToken, caseId);
    setDetail(data);
  }, [accessToken, caseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/inspector/${caseId}`);
      return;
    }
    if (!isInspectorOrAdmin(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load case.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, caseId, isAuthenticated, load, router, user]);

  async function runAction(fn: () => Promise<void>) {
    setActing(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Action failed.");
    } finally {
      setActing(false);
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
        <p className="text-sm text-red-700">{error ?? "Case not found."}</p>
        <Link href="/inspector" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
          Back to queue
        </Link>
      </div>
    );
  }

  const meta = VERIFICATION_STATUS_META[detail.status];
  const closed = detail.status === "APPROVED" || detail.status === "REJECTED";

  return (
    <div className="min-w-0 space-y-6">
      <Link href="/inspector" className="inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy">
        <ArrowLeft className="h-4 w-4" />
        Verification queue
      </Link>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ustawi-navy">{detail.property_title}</h2>
            <p className="mt-1 text-sm text-ustawi-muted">
              {detail.owner_name} · {detail.property_location}
            </p>
            <p className="mt-1 text-xs text-ustawi-muted">Submitted {formatVerificationDate(detail.submitted_at)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
        </div>

        {!closed && detail.status === "PENDING" && (
          <Button
            type="button"
            className="mt-4 rounded-xl bg-ustawi-navy"
            disabled={acting}
            onClick={() =>
              runAction(async () => {
                if (!accessToken) return;
                await startVerificationReview(accessToken, caseId);
                setActionMessage("Review started.");
              })
            }
          >
            Start review
          </Button>
        )}
      </div>

      {actionMessage && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{actionMessage}</p>
      )}
      {actionError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-ustawi-navy">Documents</h3>
            {detail.documents.length === 0 ? (
              <p className="mt-3 text-sm text-ustawi-muted">No documents uploaded.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {detail.documents.map((doc) => (
                  <li key={doc.id} className="rounded-xl border border-[#E8EAF2] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ustawi-navy">{doc.title}</p>
                        <p className="text-xs text-ustawi-muted">{doc.doc_type.replace(/_/g, " ")} · {doc.status}</p>
                      </div>
                      {doc.file && (
                        <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-ustawi-red hover:underline">
                          View file
                        </a>
                      )}
                    </div>
                    {!closed && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["APPROVED", "REJECTED"] as ReviewStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              runAction(async () => {
                                if (!accessToken) return;
                                await reviewVerificationDocument(accessToken, caseId, doc.id, status);
                                setActionMessage(`Document ${status.toLowerCase()}.`);
                              })
                            }
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-semibold",
                              status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
                            )}
                          >
                            {status === "APPROVED" ? "Approve" : "Reject"}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-ustawi-navy">Photos</h3>
            {detail.photos.length === 0 ? (
              <p className="mt-3 text-sm text-ustawi-muted">No photos.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {detail.photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-[#E8EAF2]">
                    <div className="relative aspect-[4/3]">
                      <Image src={propertyImageSrc(photo.image_url)} alt="" fill className="object-cover" unoptimized />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-ustawi-muted">{photo.verification_status}</p>
                      {!closed && (
                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              runAction(async () => {
                                if (!accessToken) return;
                                await reviewVerificationPhoto(accessToken, caseId, photo.id, "APPROVED");
                                setActionMessage("Photo approved.");
                              })
                            }
                            className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              runAction(async () => {
                                if (!accessToken) return;
                                await reviewVerificationPhoto(accessToken, caseId, photo.id, "REJECTED");
                                setActionMessage("Photo rejected.");
                              })
                            }
                            className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-ustawi-navy">Audit trail</h3>
            <ul className="mt-4 space-y-3">
              {detail.audit_trail.map((entry) => (
                <li key={entry.id} className="border-l-2 border-[#E8EAF2] pl-3">
                  <p className="text-sm font-medium text-ustawi-navy">{entry.message}</p>
                  <p className="text-xs text-ustawi-muted">
                    {entry.actor_name} · {formatVerificationDate(entry.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-ustawi-navy">Safety score</h3>
            {detail.safety_score_detail && (
              <p className="mt-2 text-2xl font-bold text-ustawi-navy">
                {detail.safety_score_detail.overall_score}/10
              </p>
            )}
            {!closed && (
              <div className="mt-4">
                <SafetyScoreForm
                  disabled={acting}
                  onSubmit={async (data) => {
                    if (!accessToken) return;
                    await submitSafetyScore(accessToken, caseId, data);
                    setActionMessage("Safety score saved.");
                    await load();
                  }}
                />
              </div>
            )}
          </section>

          {!closed && (
            <>
              <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="font-bold text-ustawi-navy">Approve listing</h3>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Optional approval notes"
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  disabled={acting}
                  className="mt-3 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={() =>
                    runAction(async () => {
                      if (!accessToken) return;
                      await approveVerificationCase(accessToken, caseId, approveNotes);
                      setActionMessage("Property approved and verified.");
                    })
                  }
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve property
                </Button>
              </section>

              <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="font-bold text-ustawi-navy">Request documents</h3>
                <textarea
                  value={changesMessage}
                  onChange={(e) => setChangesMessage(e.target.value)}
                  placeholder="What should the landlord provide?"
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={acting}
                  className="mt-3 w-full"
                  onClick={() =>
                    runAction(async () => {
                      if (!accessToken) return;
                      await requestVerificationChanges(accessToken, caseId, changesMessage);
                      setActionMessage("Changes requested from landlord.");
                    })
                  }
                >
                  Request changes
                </Button>
              </section>

              <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
                <h3 className="font-bold text-red-800">Reject listing</h3>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason"
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-red-200 px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  disabled={acting}
                  className="mt-3 w-full rounded-xl bg-red-600 hover:bg-red-700"
                  onClick={() =>
                    runAction(async () => {
                      if (!accessToken) return;
                      await rejectVerificationCase(accessToken, caseId, rejectReason);
                      setActionMessage("Property verification rejected.");
                    })
                  }
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject property
                </Button>
              </section>
            </>
          )}

          {detail.changes_requested && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Changes requested:</strong> {detail.changes_requested}
            </p>
          )}
          {detail.rejection_reason && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>Rejection reason:</strong> {detail.rejection_reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
