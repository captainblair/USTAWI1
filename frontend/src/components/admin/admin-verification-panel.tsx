"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SimpleDonutChart } from "@/components/admin/admin-charts";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchVerificationPipeline } from "@/lib/api/admin-verification";
import { fetchInspectorQueue } from "@/lib/api/inspector-verification";
import { isAdmin } from "@/lib/auth/constants";
import { formatVerificationDate, VERIFICATION_STATUS_META } from "@/lib/verification/status";
import type { VerificationCaseListItem, VerificationPipelineStats } from "@/types/verification";
import { ApiRequestError } from "@/types/api";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
      <p className="text-sm text-ustawi-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ustawi-navy">{value}</p>
    </div>
  );
}

export function AdminVerificationPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<VerificationPipelineStats | null>(null);
  const [recent, setRecent] = useState<VerificationCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/admin/verification");
      return;
    }
    if (!isAdmin(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pipeline, queue] = await Promise.all([
          fetchVerificationPipeline(accessToken!),
          fetchInspectorQueue(accessToken!, "pending"),
        ]);
        if (!cancelled) {
          setStats(pipeline);
          setRecent(queue.results.slice(0, 10));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load pipeline.");
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

  if (error || !stats) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? "Unavailable."}</p>;
  }

  const donutData = {
    type: "donut" as const,
    labels: stats.breakdown.map((b) => b.status.replace(/_/g, " ")),
    datasets: [{ data: stats.breakdown.map((b) => b.count) }],
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="In review" value={stats.in_review} />
        <StatCard label="Awaiting docs" value={stats.awaiting_docs} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="Total open" value={stats.total_open} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
          <h3 className="font-bold text-ustawi-navy">Pipeline breakdown</h3>
          <div className="mt-4">
            <SimpleDonutChart chart={donutData} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
          <h3 className="font-bold text-ustawi-navy">Listing metrics</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-ustawi-muted">Active listings</dt>
              <dd className="font-semibold text-ustawi-navy">{stats.active_listings ?? "—"}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-ustawi-muted">Verified listings</dt>
              <dd className="font-semibold text-ustawi-navy">{stats.verified_listings ?? "—"}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-ustawi-muted">Pending verifications</dt>
              <dd className="font-semibold text-ustawi-navy">{stats.pending_verifications ?? stats.pending}</dd>
            </div>
          </dl>
          <Link href="/inspector" className="mt-6 inline-block text-sm font-semibold text-ustawi-red hover:underline">
            Open inspector queue →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-ustawi-navy">Recent pending cases</h3>
          <Link href="/inspector" className="text-sm font-semibold text-ustawi-red hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-ustawi-muted">No pending cases.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E8EAF2]">
            {recent.map((item) => {
              const meta = VERIFICATION_STATUS_META[item.status];
              return (
                <li key={item.id}>
                  <Link href={`/inspector/${item.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-[#FAFBFE]">
                    <div className="min-w-0">
                      <p className="font-semibold text-ustawi-navy">{item.property_title}</p>
                      <p className="text-sm text-ustawi-muted">
                        {item.owner_name} · {formatVerificationDate(item.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
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
