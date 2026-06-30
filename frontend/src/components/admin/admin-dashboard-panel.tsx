"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminDashboard } from "@/lib/api/analytics";
import { isAdmin } from "@/lib/auth/constants";
import type { AdminDashboardKpis } from "@/types/analytics";
import { ApiRequestError } from "@/types/api";

function formatKes(amount: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDjangoAdminUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";
  return apiBase.replace(/\/api\/v1\/?$/, "/admin/");
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ustawi-border bg-white p-5 shadow-sm">
      <p className="text-sm text-ustawi-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ustawi-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-ustawi-muted">{hint}</p>}
    </div>
  );
}

function RoleBreakdown({ usersByRole }: { usersByRole: Record<string, number> }) {
  const entries = Object.entries(usersByRole).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ustawi-navy">
        <Users className="h-4 w-4 text-ustawi-red" />
        Users by role
      </h3>
      <ul className="mt-4 space-y-2">
        {entries.map(([role, count]) => (
          <li key={role} className="flex items-center justify-between text-sm">
            <span className="capitalize text-ustawi-muted">{role.toLowerCase()}</span>
            <span className="font-semibold text-ustawi-navy">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminDashboardPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [kpis, setKpis] = useState<AdminDashboardKpis | null>(null);
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
        const data = await fetchAdminDashboard(accessToken!);
        if (!cancelled) setKpis(data.kpis);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load admin dashboard.");
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
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-ustawi-sand" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Dashboard unavailable."}
      </div>
    );
  }

  const djangoAdminUrl = getDjangoAdminUrl();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-ustawi-navy/10 bg-ustawi-navy p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Platform admin</p>
            <h2 className="mt-2 text-2xl font-bold">Welcome back, {user?.full_name ?? user?.email}</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Overview of users, listings, revenue, and verification queue. Full data management is available in
              Django admin until role-specific frontend portals ship.
            </p>
          </div>
          <a
            href={djangoAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ustawi-navy transition hover:bg-ustawi-cream"
          >
            Open Django admin
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total users" value={kpis.total_users} hint={`+${kpis.new_users_this_month} this month`} />
        <KpiCard label="Active listings" value={kpis.active_listings} />
        <KpiCard label="Occupied properties" value={kpis.occupied_properties} hint={`${kpis.platform_occupancy_rate}% occupancy`} />
        <KpiCard
          label="Revenue (all time)"
          value={formatKes(kpis.total_revenue, kpis.currency)}
          hint={`${formatKes(kpis.revenue_this_month, kpis.currency)} this month`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Active leases" value={kpis.active_leases} />
        <KpiCard label="Pending verifications" value={kpis.pending_verifications} />
        <RoleBreakdown usersByRole={kpis.users_by_role} />
      </div>

      <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ustawi-navy">
          <ShieldCheck className="h-4 w-4 text-ustawi-red" />
          Admin capabilities (backend ready)
        </h3>
        <ul className="mt-4 grid gap-2 text-sm text-ustawi-muted sm:grid-cols-2">
          <li>• Platform analytics & user growth charts</li>
          <li>• Verification pipeline management</li>
          <li>• Support case management</li>
          <li>• User, property, and payment oversight</li>
        </ul>
        <p className="mt-4 text-xs text-ustawi-muted">
          These APIs are live on the backend. This page shows KPIs; detailed CRUD uses{" "}
          <a href={djangoAdminUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ustawi-navy underline">
            Django admin
          </a>{" "}
          for now. A full admin UI is planned (wireframe page #19).
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-block text-sm font-semibold text-ustawi-red hover:underline"
        >
          Go to profile settings →
        </Link>
      </div>
    </div>
  );
}
