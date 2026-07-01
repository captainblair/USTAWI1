"use client";

import Link from "next/link";
import type { NotificationItem } from "@/types/notifications";
import {
  NOTIFICATION_CATEGORY_META,
  formatNotificationTime,
  notificationActionLabel,
} from "@/lib/notifications/status";

export function NotificationDetailSidebar({ item }: { item: NotificationItem | null }) {
  if (!item) {
    return (
      <div className="hidden rounded-2xl border border-[#E8EAF2] bg-white p-6 shadow-sm lg:block">
        <h2 className="text-lg font-bold text-ustawi-navy">Details</h2>
        <p className="mt-4 text-sm text-ustawi-muted">Select a notification to view details and actions.</p>
      </div>
    );
  }

  const meta = NOTIFICATION_CATEGORY_META[item.category];
  const Icon = meta.icon;
  const actionLabel = notificationActionLabel(item);

  return (
    <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-bold text-ustawi-navy">Details</h2>

      <div className="mt-4 flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ustawi-navy">{item.title}</p>
          <p className="mt-1 text-xs text-ustawi-muted">
            {meta.label} · {formatNotificationTime(item.created_at)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ustawi-navy">{item.message}</p>

      <div className="mt-6 space-y-2 border-t border-[#E8EAF2] pt-5">
        {item.action_path ? (
          <Link
            href={item.action_path}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#EF3D32] text-sm font-bold text-white hover:bg-[#EF3D32]/90"
          >
            {actionLabel}
          </Link>
        ) : null}
        <Link
          href="/profile"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-[#E8EAF2] text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
        >
          Notification settings
        </Link>
      </div>
    </div>
  );
}
