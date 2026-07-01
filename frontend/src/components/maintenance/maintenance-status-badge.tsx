import type { MaintenanceStatus } from "@/types/maintenance";
import { MAINTENANCE_STATUS_META } from "@/lib/maintenance/status";
import { cn } from "@/lib/utils";

type MaintenanceStatusBadgeProps = {
  status: MaintenanceStatus;
  className?: string;
  compact?: boolean;
};

export function MaintenanceStatusBadge({ status, className, compact }: MaintenanceStatusBadgeProps) {
  const meta = MAINTENANCE_STATUS_META[status];
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
