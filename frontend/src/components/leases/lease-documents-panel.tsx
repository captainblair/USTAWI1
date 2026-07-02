"use client";

import { Check, CircleCheck, Download, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LeasePdfViewer } from "@/components/leases/lease-pdf-viewer";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { buildLeaseDocTabs } from "@/lib/leases/documents";
import {
  downloadLeaseDocumentPdf,
  openLeaseDocumentInNewTab,
} from "@/lib/leases/download-document";
import { formatLeaseDate } from "@/lib/leases/status";
import type { LeaseDetail, LeaseStatus } from "@/types/lease";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  label: string;
  date: string | null;
  done: boolean;
};

type LeaseDocumentsPanelProps = {
  lease: LeaseDetail;
  accessToken: string;
  asLandlord?: boolean;
  status: LeaseStatus;
  monthsRemaining: number;
  counterpartyLabel: string;
  counterpartyName: string;
  onDownload?: () => void;
  onShare?: () => void;
};

export function LeaseDocumentsPanel({
  lease,
  accessToken,
  asLandlord = false,
  status,
  monthsRemaining,
  counterpartyLabel,
  counterpartyName,
  onDownload,
  onShare,
}: LeaseDocumentsPanelProps) {
  const docTabs = useMemo(() => buildLeaseDocTabs(lease), [lease]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (docTabs.length && !activeTabId) {
      setActiveTabId(docTabs[0].id);
    }
  }, [activeTabId, docTabs]);

  const activeTab = docTabs.find((t) => t.id === activeTabId) ?? docTabs[0];
  const activeDocId = activeTab?.id ?? "";

  const timelineEvents: TimelineEvent[] = [
    { label: "Lease created", date: lease.created_at, done: true },
    {
      label: "Tenant signed",
      date: lease.signature_status.tenant_signed_at,
      done: lease.signature_status.tenant_signed,
    },
    {
      label: "Landlord signed",
      date: lease.signature_status.landlord_signed_at,
      done: lease.signature_status.landlord_signed,
    },
    { label: "Lease activated", date: lease.activated_at, done: Boolean(lease.activated_at) },
  ];

  async function handleDownload() {
    if (onDownload) {
      onDownload();
      return;
    }
    const docId = lease.signed_pdf_url && !activeDocId ? "signed-pdf" : activeDocId;
    if (!docId) return;
    try {
      await downloadLeaseDocumentPdf(accessToken, lease.id, docId, {
        asLandlord,
        signedPdf: docId === "signed-pdf",
      });
    } catch {
      // Parent panels may surface errors via onDownload in future
    }
  }

  async function handleOpenInNewTab() {
    const docId = lease.signed_pdf_url && !activeDocId ? "signed-pdf" : activeDocId;
    if (!docId) return;
    await openLeaseDocumentInNewTab(accessToken, lease.id, docId, {
      asLandlord,
      signedPdf: docId === "signed-pdf",
    });
  }

  async function handleShare() {
    if (onShare) {
      await onShare();
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white shadow-sm">
      {docTabs.length > 0 && (
        <div className="-mb-px flex gap-0.5 overflow-x-auto border-b border-[#E8EAF2] px-3 pt-2 scrollbar-none sm:gap-1 sm:px-4 sm:pt-3">
          {docTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-2.5 pb-2.5 text-xs font-semibold transition sm:px-3 sm:pb-3 sm:text-sm",
                activeTabId === tab.id
                  ? "border-ustawi-navy text-ustawi-navy"
                  : "border-transparent text-ustawi-muted hover:text-ustawi-navy",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 sm:p-5">
        <div className="overflow-hidden rounded-xl border border-[#E8EAF2] bg-[#FAFBFE]">
          <LeasePdfViewer
            leaseId={lease.id}
            accessToken={accessToken}
            docId={activeDocId}
            signedPdf={activeDocId === "signed-pdf"}
            asLandlord={asLandlord}
            title={activeTab?.label ?? "Lease document"}
            subtitle={`${lease.property_title} · ${formatLeaseDate(lease.start_date)}`}
          />
        </div>

        {activeDocId && (
          <p className="mt-2 text-center sm:mt-3">
            <button
              type="button"
              onClick={() => void handleOpenInNewTab()}
              className="text-xs font-semibold text-ustawi-navy underline-offset-2 hover:underline sm:text-sm"
            >
              Open full document in new tab
            </button>
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={!activeDocId && !lease.signed_pdf_url}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E8EAF2] px-4 py-2.5 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream disabled:opacity-50 sm:w-auto sm:py-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          {onShare && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E8EAF2] px-4 py-2.5 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream sm:w-auto sm:py-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          )}
          {(activeTab?.signed || lease.signed_pdf_url) && (
            <span className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 sm:ml-auto sm:justify-start">
              <CircleCheck className="h-5 w-5" />
              Signed
            </span>
          )}
        </div>

        <div className="mt-5 border-t border-[#E8EAF2] pt-4 sm:mt-6 sm:pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Timeline</p>
          {/* Mobile: vertical stack */}
          <ul className="mt-3 space-y-3 sm:hidden">
            {timelineEvents.map((event, index) => (
              <li key={event.label} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    event.done ? "bg-emerald-100 text-emerald-700" : "bg-[#E8EAF2] text-ustawi-muted",
                  )}
                >
                  {event.done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ustawi-navy">{event.label}</p>
                  {event.date && (
                    <p className="text-xs text-ustawi-muted">{formatLeaseDate(event.date)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop: horizontal */}
          <div className="mt-3 hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
            {timelineEvents.map((event, index) => (
              <div key={event.label} className="flex shrink-0 items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    event.done ? "bg-emerald-100 text-emerald-700" : "bg-[#E8EAF2] text-ustawi-muted",
                  )}
                >
                  {event.done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-[100px]">
                  <p className="text-xs font-semibold text-ustawi-navy">{event.label}</p>
                  {event.date && (
                    <p className="text-[11px] text-ustawi-muted">{formatLeaseDate(event.date)}</p>
                  )}
                </div>
                {index < timelineEvents.length - 1 && (
                  <div className="mx-1 h-px w-8 bg-[#E8EAF2]" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E8EAF2] pt-4 text-sm sm:mt-5 sm:grid-cols-3 sm:pt-5">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-ustawi-muted sm:text-sm">{counterpartyLabel}</p>
            <p className="font-semibold text-ustawi-navy">{counterpartyName}</p>
          </div>
          <div>
            <p className="text-xs text-ustawi-muted sm:text-sm">Expires in</p>
            <p className="font-semibold text-ustawi-navy">
              {monthsRemaining} mo{monthsRemaining === 1 ? "" : "s"}
            </p>
          </div>
          <div>
            <p className="text-xs text-ustawi-muted sm:text-sm">Status</p>
            <LeaseStatusBadge status={status} className="mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

