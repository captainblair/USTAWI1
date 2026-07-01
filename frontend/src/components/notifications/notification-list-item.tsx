"use client";

import Link from "next/link";
import type { NotificationItem } from "@/types/notifications";
import {
  NOTIFICATION_CATEGORY_META,
  formatNotificationTime,
  notificationActionLabel,
} from "@/lib/notifications/status";
import { cn } from "@/lib/utils";

type NotificationListItemProps = {
  item: NotificationItem;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
};

export function NotificationListItem({ item, selected, onSelect, compact }: NotificationListItemProps) {
  const meta = NOTIFICATION_CATEGORY_META[item.category];
  const Icon = meta.icon;
  const actionHref = item.action_path || "#";
  const actionLabel = notificationActionLabel(item);

  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          meta.iconClass,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className={cn("font-bold text-ustawi-navy", !item.is_read && "pr-2")}>{item.title}</p>
          <span className="shrink-0 text-xs text-ustawi-muted">{formatNotificationTime(item.created_at)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ustawi-muted">{item.message}</p>
        {!compact && item.action_path && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href={actionHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 items-center rounded-lg bg-[#EF3D32] px-4 text-sm font-bold text-white hover:bg-[#EF3D32]/90"
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </div>
      {!item.is_read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#EF3D32]" aria-label="Unread" />
      )}
    </>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition",
          selected ? "border-ustawi-navy ring-1 ring-ustawi-navy/15" : "border-[#E8EAF2] hover:border-ustawi-navy/20",
          !item.is_read && !selected && "border-l-4 border-l-[#EF3D32]",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:p-5",
        !item.is_read && "border-l-4 border-l-[#EF3D32] border-[#E8EAF2]",
        item.is_read && "border-[#E8EAF2]",
      )}
    >
      {content}
    </div>
  );
}
