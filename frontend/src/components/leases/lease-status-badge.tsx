import type { LeaseStatus } from "@/types/lease";
import { LEASE_STATUS_META } from "@/lib/leases/status";
import { cn } from "@/lib/utils";

type LeaseStatusBadgeProps = {
  status: LeaseStatus;
  className?: string;
  compact?: boolean;
};

export function LeaseStatusBadge({ status, className, compact }: LeaseStatusBadgeProps) {
  const meta = LEASE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {compact ? meta.summaryLabel ?? meta.label : meta.label}
    </span>
  );
}
