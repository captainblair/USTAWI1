"use client";

import { BadgeCheck, Check, Home } from "lucide-react";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { formatLeaseDate, isActiveLeaseStatus, LEASE_STATUS_META } from "@/lib/leases/status";
import { formatPrice } from "@/lib/utils";
import type { LeaseDetail, LeaseStatus } from "@/types/lease";
import { cn } from "@/lib/utils";

type SummaryRow = {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
};

type LeaseSummarySidebarProps = {
  lease: LeaseDetail;
  status: LeaseStatus;
  title?: string;
  rows: SummaryRow[];
  keyTerms?: { label: string }[];
  payRentAction?: React.ReactNode;
  className?: string;
};

export function LeaseSummarySidebar({
  lease,
  status,
  title = "Lease summary",
  rows,
  keyTerms,
  payRentAction,
  className,
}: LeaseSummarySidebarProps) {
  const statusMeta = LEASE_STATUS_META[status];

  return (
    <div className={cn("space-y-4 sm:space-y-5", className)}>
      <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white shadow-sm">
        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#E8EAF2] to-[#DDE1EE] sm:h-36">
          <Home className="h-10 w-10 text-[#1F2B6C]/35 sm:h-12 sm:w-12" strokeWidth={1.5} />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ustawi-muted sm:text-xs">{title}</p>
            <LeaseStatusBadge status={status} compact className="sm:hidden" />
          </div>
          <h1 className="mt-1.5 text-lg font-bold leading-tight text-ustawi-navy sm:mt-2 sm:text-xl">
            {lease.property_title}
          </h1>
          <p className="mt-1 text-sm text-ustawi-muted">{lease.property_address}</p>
          <p className="mt-1 text-[11px] text-ustawi-muted sm:text-xs">
            Ref · {lease.id.slice(0, 8).toUpperCase()} · {formatLeaseDate(lease.start_date)}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#E8EAF2] pt-4 text-sm sm:mt-5 sm:block sm:space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                <dt className="text-xs text-ustawi-muted sm:text-sm">{row.label}</dt>
                <dd
                  className={cn(
                    "text-sm text-ustawi-navy sm:text-right",
                    row.highlight ? "font-bold" : "font-medium",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 hidden flex-wrap items-center gap-2 sm:flex">
            <span className="text-sm text-ustawi-muted">Status:</span>
            <span className="text-sm font-bold text-emerald-700">{statusMeta.summaryLabel ?? statusMeta.label}</span>
            {isActiveLeaseStatus(status) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>

          {payRentAction}
        </div>
      </div>

      {keyTerms && keyTerms.length > 0 && (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-ustawi-navy">Key terms</h2>
          <ul className="mt-3 space-y-2 text-sm text-ustawi-navy">
            {keyTerms.map((term) => (
              <li key={term.label} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {term.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
