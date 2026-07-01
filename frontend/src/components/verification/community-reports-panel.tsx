"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchCommunityReportsModeration } from "@/lib/api/community-reports";
import { isInspectorOrAdmin } from "@/lib/auth/constants";
import type { CommunityReport } from "@/types/verification";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "DISMISSED", label: "Dismissed" },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  VERIFIED: { label: "Verified", className: "bg-emerald-100 text-emerald-800" },
  DISMISSED: { label: "Dismissed", className: "bg-gray-100 text-gray-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function CommunityReportsPanel({ basePath }: { basePath: "/admin/community-reports" | "/inspector/community-reports" }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState("");
  const [items, setItems] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchCommunityReportsModeration(accessToken, tab || undefined);
    setItems(data.results);
  }, [accessToken, tab]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=${basePath}`);
      return;
    }
    if (!isInspectorOrAdmin(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, basePath, isAuthenticated, load, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ustawi-muted">
        Review tenant-submitted community reports. Status changes are managed in Django admin for now.
      </p>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex max-w-full gap-2 pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value || "all"}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === t.value
                  ? "border-ustawi-navy bg-ustawi-navy text-white"
                  : "border-[#E8EAF2] bg-white text-ustawi-navy hover:bg-ustawi-cream",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
          <MessageSquareWarning className="mx-auto h-10 w-10 text-ustawi-muted/40" />
          <p className="mt-3 font-semibold text-ustawi-navy">No community reports</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((report) => {
            const meta = STATUS_META[report.status] ?? { label: report.status, className: "bg-gray-100 text-gray-700" };
            return (
              <li key={report.id} className="rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/properties/${report.property_id}`} className="font-bold text-ustawi-navy hover:underline">
                      {report.property_title}
                    </Link>
                    <p className="mt-1 font-semibold text-ustawi-navy">{report.title}</p>
                    <p className="mt-2 text-sm text-ustawi-muted">{report.description}</p>
                    <p className="mt-2 text-xs text-ustawi-muted">
                      {report.category.replace(/_/g, " ")} · Severity {report.severity} · {report.reporter_name} ·{" "}
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
