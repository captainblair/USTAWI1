"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { useEffect, useState } from "react";

import { ChartCard, SimpleDonutChart, SimpleLineChart } from "@/components/analytics/charts";

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



      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">

        <ChartCard title="Revenue trends" className="lg:col-span-1 xl:col-span-1">

          <SimpleLineChart chart={charts.revenue_trend} />

        </ChartCard>

        <ChartCard title="Applications by status">

          <SimpleDonutChart chart={charts.applications_by_status} />

        </ChartCard>

        <ChartCard title="Occupancy breakdown">

          <SimpleDonutChart chart={charts.occupancy_breakdown} />

        </ChartCard>

      </div>



      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

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

                  <Link href={`/landlord/applications/${app.id}`} className="block hover:opacity-90">

                    <p className="text-sm font-semibold text-ustawi-navy">Tenant application — {app.tenant_name}</p>

                    <p className="text-xs text-ustawi-muted">{app.property_title}</p>

                    <p className="mt-0.5 text-xs capitalize text-ustawi-muted">{app.status.toLowerCase().replace(/_/g, " ")}</p>

                  </Link>

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

                <li key={p.id}>

                  <Link href={`/landlord/properties/${p.id}`} className="flex items-center justify-between text-sm hover:opacity-90">

                    <span className="truncate font-medium text-ustawi-navy">{p.title}</span>

                    <span className="shrink-0 text-ustawi-muted">{p.application_count} apps</span>

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

