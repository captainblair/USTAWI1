"use client";

import { cn } from "@/lib/utils";

export type LeaseStatusTab = {
  value: string;
  label: string;
  count?: number;
};

type LeaseStatusFilterTabsProps = {
  tabs: LeaseStatusTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function LeaseStatusFilterTabs({ tabs, value, onChange, className }: LeaseStatusFilterTabsProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none snap-x snap-mandatory",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "snap-start shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
              active
                ? "border-ustawi-navy bg-ustawi-navy text-white shadow-sm"
                : "border-[#E8EAF2] bg-white text-ustawi-navy hover:border-ustawi-navy/20 hover:bg-ustawi-cream",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold sm:text-xs",
                  active ? "bg-white/20 text-white" : "bg-[#E8EAF2] text-ustawi-navy",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
