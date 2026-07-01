"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Home, Loader2, Shield, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ApplicationStatusBadge,
} from "@/components/applications/application-status-badge";
import { ChartCard, SimpleDonutChart, SimpleLineChart } from "@/components/analytics/charts";
import { PropertyRecommendationsCarousel } from "@/components/analytics/property-recommendations-carousel";
import { SafetyBadge } from "@/components/properties/safety-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchTenantDashboard } from "@/lib/api/analytics";
import { isTenant } from "@/lib/auth/constants";
import type { TenantDashboard } from "@/types/analytics";
import type { ApplicationStatus } from "@/types/application";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

function DarkKpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Home;
}) {
  return (
    <div className="rounded-2xl bg-[#1F2B6C] p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white/70">{label}</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/55">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

function formatDueDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function TenantDashboardPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/dashboard");
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await fetchTenantDashboard(accessToken!);
        if (!cancelled) setData(dashboard);
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

  const { kpis, recent_applications, recommendations, charts } = data;
  const lease = kpis.active_lease;
  const rent = kpis.upcoming_rent;
  const safetyScore = kpis.safety_score ?? lease?.safety_score ?? null;

  const upcomingRentValue = rent
    ? formatPrice(rent.amount, rent.currency)
    : lease
      ? formatPrice(lease.rent_amount, lease.currency)
      : "—";

  const upcomingRentHint = rent?.is_due
    ? rent.days_overdue
      ? `${rent.days_overdue} days overdue · Due ${formatDueDate(rent.due_date)}`
      : `Due ${formatDueDate(rent.due_date)}`
    : lease
      ? "Next billing cycle"
      : "No active lease";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DarkKpi
          label="Active lease"
          value={lease ? lease.property_title : "None"}
          hint={lease ? `${lease.status.replace(/_/g, " ")} · Until ${formatDueDate(lease.end_date)}` : "Browse properties to apply"}
          icon={Home}
        />
        <DarkKpi
          label="Upcoming rent"
          value={upcomingRentValue}
          hint={upcomingRentHint}
          icon={Wallet}
        />
        <DarkKpi
          label="Safety score"
          value={safetyScore !== null ? `${safetyScore}/10` : "—"}
          hint={lease ? "Your current home" : "Based on active lease"}
          icon={Shield}
        />
        <DarkKpi
          label="Pending applications"
          value={String(kpis.pending_applications)}
          hint="Awaiting landlord review"
          icon={Calendar}
        />
      </div>

      {lease && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
          <SafetyBadge score={String(safetyScore ?? lease.safety_score)} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ustawi-navy">{lease.property_title}</p>
            <p className="text-sm text-ustawi-muted">
              {formatPrice(lease.rent_amount, lease.currency)}/mo · {formatDueDate(lease.start_date)} –{" "}
              {formatDueDate(lease.end_date)}
            </p>
          </div>
          <Link href={`/leases/${lease.id}`} className="text-sm font-semibold text-ustawi-red hover:underline">
            View lease
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Payment history">
          {(charts.payment_history.datasets[0]?.data.length ?? 0) > 0 ? (
            <SimpleLineChart chart={charts.payment_history} />
          ) : (
            <p className="text-sm text-ustawi-muted">No completed rent payments yet.</p>
          )}
        </ChartCard>
        <ChartCard title="Applications by status">
          {(charts.application_status.datasets[0]?.data.length ?? 0) > 0 ? (
            <SimpleDonutChart chart={charts.application_status} />
          ) : (
            <p className="text-sm text-ustawi-muted">No applications yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ustawi-navy">Recommended for you</h3>
            <Link href="/properties" className="text-xs font-semibold text-ustawi-red hover:underline">
              Browse all
            </Link>
          </div>
          <div className="mt-4">
            <PropertyRecommendationsCarousel properties={recommendations} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ustawi-navy">Recent applications</h3>
            <Link href="/applications" className="text-xs font-semibold text-ustawi-navy hover:underline">
              View all
            </Link>
          </div>
          {recent_applications.length === 0 ? (
            <p className="mt-4 text-sm text-ustawi-muted">
              No applications yet.{" "}
              <Link href="/properties" className="font-semibold text-ustawi-navy underline">
                Search properties
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent_applications.map((app) => (
                <li key={app.id} className="border-b border-[#E8EAF2] pb-3 last:border-0 last:pb-0">
                  <Link href={`/applications/${app.id}`} className="block hover:opacity-90">
                    <p className="text-sm font-semibold text-ustawi-navy">{app.property_title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                      {app.screening_score !== null && app.screening_score > 0 && (
                        <span className="text-xs text-ustawi-muted">Score {app.screening_score}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
