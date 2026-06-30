import type { ApplicationStatus } from "@/types/application";
import { APPLICATION_STATUS_META } from "@/lib/applications/status";
import { cn } from "@/lib/utils";

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const meta = APPLICATION_STATUS_META[status] ?? APPLICATION_STATUS_META.DRAFT;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function ScreeningScoreBadge({ score, label }: { score: number; label?: string }) {
  const tone =
    score >= 85 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score >= 70
      ? "text-teal-700 bg-teal-50 border-teal-200"
      : score >= 50
        ? "text-amber-800 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", tone)}>
      Score {score}
      {label && <span className="font-normal opacity-80">· {label}</span>}
    </span>
  );
}
