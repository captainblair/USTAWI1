"use client";

import { Check, Clock } from "lucide-react";
import {
  formatMaintenanceDate,
  MAINTENANCE_STATUS_META,
} from "@/lib/maintenance/status";
import type { MaintenanceTimelineEntry } from "@/types/maintenance";
import { cn } from "@/lib/utils";

function timelineLabel(entry: MaintenanceTimelineEntry): string {
  if (entry.message) return entry.message;
  if (entry.update_type === "ASSIGNMENT") return "Technician assigned";
  if (entry.update_type === "CREATED") return "Request submitted";
  if (entry.update_type === "STATUS_CHANGE" && entry.new_status) {
    const meta = MAINTENANCE_STATUS_META[entry.new_status as keyof typeof MAINTENANCE_STATUS_META];
    return meta ? `Status updated to ${meta.label}` : "Status updated";
  }
  return entry.update_type.replace("_", " ").toLowerCase();
}

type MaintenanceTimelineProps = {
  entries: MaintenanceTimelineEntry[];
  className?: string;
};

export function MaintenanceTimeline({ entries, className }: MaintenanceTimelineProps) {
  if (entries.length === 0) {
    return <p className={cn("text-sm text-ustawi-muted", className)}>No activity yet.</p>;
  }

  return (
    <ul className={cn("space-y-4", className)}>
      {[...entries].reverse().map((entry, index) => (
        <li key={entry.id} className="flex gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              index === 0 ? "bg-emerald-100 text-emerald-700" : "bg-[#E8EAF2] text-ustawi-muted",
            )}
          >
            {index === 0 ? <Check className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ustawi-navy">{timelineLabel(entry)}</p>
            <p className="text-xs text-ustawi-muted">
              {entry.actor_name} · {formatMaintenanceDate(entry.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
