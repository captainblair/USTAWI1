"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  addSupportCaseMessage,
  escalateSupportCase,
  fetchAdminSupportCase,
  updateSupportCaseStatus,
} from "@/lib/api/admin-support";
import { isAdmin } from "@/lib/auth/constants";
import type { SupportCaseDetail, SupportCaseStatus } from "@/types/support";
import { ApiRequestError } from "@/types/api";

const STATUS_OPTIONS: SupportCaseStatus[] = ["OPEN", "UNDER_REVIEW", "ESCALATED", "RESOLVED"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminSupportDetailPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<SupportCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [status, setStatus] = useState<SupportCaseStatus>("OPEN");
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchAdminSupportCase(accessToken, caseId);
    setDetail(data);
    setStatus(data.status);
    setResolutionNotes(data.resolution_notes);
  }, [accessToken, caseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/admin/support/${caseId}`);
      return;
    }
    if (!isAdmin(user)) {
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
    setActionErr(null);
    setActionMsg(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionErr(err instanceof ApiRequestError ? err.message : "Action failed.");
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
        <Link href="/admin/support" className="mt-4 inline-block text-sm font-semibold text-ustawi-navy hover:underline">
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <Link href="/admin/support" className="inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy">
        <ArrowLeft className="h-4 w-4" />
        Support inbox
      </Link>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">{detail.case_number}</p>
        <h2 className="mt-1 text-xl font-bold text-ustawi-navy">{detail.subject}</h2>
        <p className="mt-2 text-sm text-ustawi-muted">
          {detail.category.replace(/_/g, " ")} · Urgency {detail.urgency} · Opened {formatDateTime(detail.created_at)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-ustawi-navy">{detail.description}</p>
      </div>

      {actionMsg && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{actionMsg}</p>}
      {actionErr && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionErr}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-bold text-ustawi-navy">Messages</h3>
          {detail.messages.length === 0 ? (
            <p className="mt-3 text-sm text-ustawi-muted">No messages yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {detail.messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`rounded-xl p-3 ${msg.is_internal ? "bg-amber-50 border border-amber-100" : "bg-[#F7F8FC]"}`}
                >
                  <p className="text-xs font-semibold text-ustawi-muted">
                    {msg.sender_name} · {formatDateTime(msg.created_at)}
                    {msg.is_internal && " · Internal"}
                  </p>
                  <p className="mt-1 text-sm text-ustawi-navy">{msg.body}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-[#E8EAF2] pt-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Reply to user…"
              className="w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-ustawi-muted">
              <input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} />
              Internal note (not visible to user)
            </label>
            <Button
              type="button"
              disabled={acting || !message.trim()}
              className="mt-3 rounded-xl bg-ustawi-navy"
              onClick={() =>
                runAction(async () => {
                  if (!accessToken) return;
                  await addSupportCaseMessage(accessToken, caseId, message, internalNote);
                  setMessage("");
                  setActionMsg("Message sent.");
                })
              }
            >
              Send message
            </Button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-ustawi-navy">Update status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SupportCaseStatus)}
              className="mt-3 w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
              placeholder="Resolution notes"
              className="mt-3 w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm"
            />
            <Button
              type="button"
              disabled={acting}
              className="mt-3 w-full rounded-xl bg-ustawi-navy"
              onClick={() =>
                runAction(async () => {
                  if (!accessToken) return;
                  await updateSupportCaseStatus(accessToken, caseId, status, resolutionNotes);
                  setActionMsg("Status updated.");
                })
              }
            >
              Save status
            </Button>
          </section>

          {detail.status !== "ESCALATED" && detail.status !== "RESOLVED" && (
            <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
              <h3 className="font-bold text-red-800">Escalate</h3>
              <Button
                type="button"
                variant="outline"
                disabled={acting}
                className="mt-3 w-full border-red-300 text-red-800"
                onClick={() =>
                  runAction(async () => {
                    if (!accessToken) return;
                    await escalateSupportCase(accessToken, caseId, "Escalated from admin panel");
                    setActionMsg("Case escalated.");
                  })
                }
              >
                Escalate case
              </Button>
            </section>
          )}

          {detail.attachments.length > 0 && (
            <section className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
              <h3 className="font-bold text-ustawi-navy">Attachments</h3>
              <ul className="mt-3 space-y-2">
                {detail.attachments.map((att) => (
                  <li key={att.id}>
                    {att.file_url ? (
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ustawi-red hover:underline">
                        {att.filename}
                      </a>
                    ) : (
                      <span className="text-sm text-ustawi-muted">{att.filename}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
