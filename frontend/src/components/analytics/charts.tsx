"use client";

import type { ChartData } from "@/types/analytics";
import { cn } from "@/lib/utils";

const DONUT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#94A3B8"];

export function SimpleLineChart({ chart, className }: { chart: ChartData; className?: string }) {
  const values = chart.datasets[0]?.data ?? [];
  const max = Math.max(...values, 1);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-40 items-end gap-2 border-b border-[#E8EAF2] pb-2">
        {values.map((value, i) => (
          <div key={chart.labels[i] ?? i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-[36px] rounded-t-md bg-[#1F2B6C]/80 transition-all"
              style={{ height: `${Math.max((value / max) * 100, 4)}%` }}
              title={String(value)}
            />
            <span className="truncate text-[10px] text-ustawi-muted">{chart.labels[i]?.slice(5) ?? chart.labels[i] ?? ""}</span>
          </div>
        ))}
      </div>
      {chart.datasets[0]?.label && (
        <p className="text-xs text-ustawi-muted">{chart.datasets[0].label}</p>
      )}
    </div>
  );
}

export function SimpleBarChart({ chart, className }: { chart: ChartData; className?: string }) {
  const values = chart.datasets[0]?.data ?? [];
  const max = Math.max(...values, 1);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-40 items-end gap-3">
        {values.map((value, i) => (
          <div key={chart.labels[i] ?? i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-emerald-500/80"
              style={{ height: `${Math.max((value / max) * 128, 8)}px` }}
            />
            <span className="text-center text-[10px] font-medium text-ustawi-muted">{chart.labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleDonutChart({ chart, className }: { chart: ChartData; className?: string }) {
  const values = chart.datasets[0]?.data ?? [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let cumulative = 0;

  const gradient = values
    .map((value, i) => {
      const start = (cumulative / total) * 100;
      cumulative += value;
      const end = (cumulative / total) * 100;
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-start", className)}>
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: total > 0 ? `conic-gradient(${gradient})` : "#E8EAF2" }}
      >
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-center">
          <div>
            <p className="text-xl font-bold text-ustawi-navy">{total}</p>
            <p className="text-[10px] text-ustawi-muted">Total</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {chart.labels.map((label, i) => (
          <li key={label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="text-ustawi-navy">{label}</span>
            </span>
            <span className="font-semibold text-ustawi-navy">{values[i] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm sm:p-6", className)}>
      <h3 className="text-sm font-bold text-ustawi-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
