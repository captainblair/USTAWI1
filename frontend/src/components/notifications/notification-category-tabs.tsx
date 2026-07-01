"use client";

import { cn } from "@/lib/utils";
import type { NotificationBadge } from "@/types/notifications";
import { NOTIFICATION_CATEGORY_TABS } from "@/lib/notifications/status";

type NotificationCategoryTabsProps = {
  value: string;
  onChange: (value: string) => void;
  badge?: NotificationBadge;
  className?: string;
};

export function NotificationCategoryTabs({ value, onChange, badge, className }: NotificationCategoryTabsProps) {
  return (
    <div
      className={cn(
        "flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {NOTIFICATION_CATEGORY_TABS.map((tab) => {
        const active = value === tab.value;
        const count = tab.badgeKey && badge ? badge[tab.badgeKey] : 0;
        return (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "snap-start shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              active
                ? "border-ustawi-navy bg-ustawi-navy text-white shadow-sm"
                : "border-[#E8EAF2] bg-white text-ustawi-navy hover:border-ustawi-navy/20 hover:bg-ustawi-cream",
            )}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-[#E8EAF2] text-ustawi-navy",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
