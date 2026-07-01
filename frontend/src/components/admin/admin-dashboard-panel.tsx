"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  DollarSign,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  ChartCard,
  SimpleBarChart,
  SimpleDonutChart,
  SimpleLineChart,
} from "@/components/admin/admin-charts";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminDashboard } from "@/lib/api/analytics";
import { fetchInspectorQueue } from "@/lib/api/inspector-verification";
import { isAdmin } from "@/lib/auth/constants";
import type { AdminDashboard } from "@/types/analytics";
import type { VerificationCaseListItem } from "@/types/verification";
import { ApiRequestError } from "@/types/api";
import { formatVerificationDate, VERIFICATION_STATUS_META } from "@/lib/verification/status";

function formatKes(amount: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl bg-[#1F2B6C] p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/70">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [pendingCases, setPendingCases] = useState<VerificationCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/admin");
      return;
    }
    if (!isAdmin(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboard, queue] = await Promise.all([
          fetchAdminDashboard(accessToken!),
          fetchInspectorQueue(accessToken!, "pending"),
        ]);
        if (!cancelled) {
          setData(dashboard);
          setPendingCases(queue.results.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Dashboard unavailable."}
      </div>
    );
  }

  const { kpis, charts } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total users" value={kpis.total_users} icon={Users} />
        <KpiCard
          label="Monthly revenue"
          value={formatKes(kpis.revenue_this_month, kpis.currency)}
          icon={DollarSign}
        />
        <KpiCard label="Active listings" value={kpis.active_listings} icon={Building2} />
        <KpiCard label="Pending verifications" value={kpis.pending_verifications} icon={ShieldCheck} />
        <KpiCard label="Occupancy rate" value={`${kpis.platform_occupancy_rate}%`} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="User growth over time">
          <SimpleLineChart chart={charts.user_growth} />
        </ChartCard>
        <ChartCard title="Monthly revenue trends">
          <SimpleLineChart chart={charts.revenue_trend} />
        </ChartCard>
        <ChartCard title="Verification pipeline breakdown" className="lg:col-span-2 xl:col-span-1">
          <SimpleDonutChart chart={charts.verification_pipeline} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Listings by status">
          <SimpleBarChart chart={charts.listings_by_status} />
        </ChartCard>
        <ChartCard title="Occupancy breakdown">
          <SimpleDonutChart chart={charts.occupancy_breakdown} />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ustawi-navy">Pending verifications</h3>
          <Link href="/inspector" className="text-sm font-semibold text-ustawi-red hover:underline">
            Open inspector queue
          </Link>
        </div>

        {pendingCases.length === 0 ? (
          <p className="mt-4 text-sm text-ustawi-muted">No properties awaiting initial review.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E8EAF2]">
            {pendingCases.map((item) => {
              const meta = VERIFICATION_STATUS_META[item.status];
              return (
                <li key={item.id}>
                  <Link
                    href={`/inspector/${item.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-[#FAFBFE]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ustawi-navy">{item.property_title}</p>
                      <p className="text-sm text-ustawi-muted">
                        {item.owner_name} · {item.property_location}
                      </p>
                      <p className="mt-0.5 text-xs text-ustawi-muted">
                        Submitted {formatVerificationDate(item.submitted_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ustawi-muted" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
