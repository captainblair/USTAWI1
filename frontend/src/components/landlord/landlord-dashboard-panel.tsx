"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordDashboard } from "@/lib/api/analytics";
import { fetchLandlordApplications } from "@/lib/api/landlord-applications";
import { isLandlord } from "@/lib/auth/constants";
import type { LandlordDashboard, LandlordApplicationInboxItem } from "@/types/landlord";
import { ApiRequestError } from "@/types/api";
import { formatPrice } from "@/lib/utils";

function DarkKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-[#1F2B6C] p-5 text-white shadow-sm">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/55">{hint}</p>}
    </div>
  );
}

function SimpleBarChart({ labels, values, title }: { labels: string[]; values: number[]; title: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-ustawi-navy">{title}</h3>
      <div className="mt-4 flex h-40 items-end gap-2">
        {values.map((v, i) => (
          <div key={labels[i]} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-[#1F2B6C]/80"
              style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            />
            <span className="truncate text-[10px] text-ustawi-muted">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleLineChart({ labels, values, title }: { labels: string[]; values: number[]; title: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-ustawi-navy">{title}</h3>
      <div className="mt-4 flex h-40 items-end gap-1">
        {values.map((v, i) => (
          <div key={labels[i]} className="relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-2 rounded-full bg-[#EF3D32]"
              style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
            />
            <span className="mt-1 truncate text-[9px] text-ustawi-muted">{labels[i].slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandlordDashboardPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<LandlordDashboard | null>(null);
  const [recentApps, setRecentApps] = useState<LandlordApplicationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord");
      return;
    }
    if (!isLandlord(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [dash, apps] = await Promise.all([
          fetchLandlordDashboard(accessToken!),
          fetchLandlordApplications(accessToken!),
        ]);
        if (!cancelled) {
          setDashboard(dash);
          setRecentApps(apps.results.slice(0, 5));
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

  if (error || !dashboard) {
    return <p className="text-sm text-red-700">{error ?? "Dashboard unavailable."}</p>;
  }

  const { kpis, top_performers, charts } = dashboard;
  const revenue = charts.revenue_trend;
  const appsChart = charts.applications_by_status;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <DarkKpi label="Total Properties" value={String(kpis.total_properties)} hint="All listings" />
        <DarkKpi
          label="Occupancy Rate"
          value={`${kpis.occupancy_rate}%`}
          hint={`${kpis.occupied_properties} occupied · Target 95%`}
        />
        <DarkKpi
          label="Monthly Income"
          value={formatPrice(kpis.monthly_income, kpis.currency)}
          hint={`${kpis.pending_applications} pending applications`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SimpleLineChart
            title="Revenue trends"
            labels={revenue.labels}
            values={revenue.datasets[0]?.data ?? []}
          />
          <SimpleBarChart
            title="Incoming applications"
            labels={appsChart.labels}
            values={appsChart.datasets[0]?.data ?? []}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ustawi-navy">Recent activity</h3>
              <Link href="/landlord/applications" className="text-xs font-semibold text-ustawi-navy hover:underline">
                View all
              </Link>
            </div>
            {recentApps.length === 0 ? (
              <p className="mt-4 text-sm text-ustawi-muted">No applications yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentApps.map((app) => (
                  <li key={app.id} className="border-b border-[#E8EAF2] pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-ustawi-navy">Tenant application — {app.tenant_name}</p>
                    <p className="text-xs text-ustawi-muted">{app.property_title}</p>
                    <p className="mt-0.5 text-xs capitalize text-ustawi-muted">{app.status.toLowerCase().replace(/_/g, " ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-ustawi-navy">Top performing properties</h3>
            {top_performers.length === 0 ? (
              <p className="mt-4 text-sm text-ustawi-muted">
                Publish a property to see performance here.{" "}
                <Link href="/landlord/properties/new" className="font-semibold text-ustawi-navy underline">
                  Add property
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {top_performers.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-ustawi-navy">{p.title}</span>
                    <span className="shrink-0 text-ustawi-muted">{p.application_count} apps</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
