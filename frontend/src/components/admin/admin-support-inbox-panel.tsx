"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminSupportCases } from "@/lib/api/admin-support";
import { isAdmin } from "@/lib/auth/constants";
import type { SupportCaseListItem, SupportCaseStatus } from "@/types/support";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "RESOLVED", label: "Resolved" },
];

const STATUS_META: Record<SupportCaseStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-100 text-blue-800" },
  UNDER_REVIEW: { label: "Under review", className: "bg-amber-100 text-amber-800" },
  ESCALATED: { label: "Escalated", className: "bg-red-100 text-red-800" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-100 text-emerald-800" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function AdminSupportInboxPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState("");
  const [items, setItems] = useState<SupportCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchAdminSupportCases(accessToken, tab ? { status: tab } : undefined);
    setItems(data.results);
  }, [accessToken, tab]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/admin/support");
      return;
    }
    if (!isAdmin(user)) {
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
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load support cases.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
          <p className="font-semibold text-ustawi-navy">No support cases</p>
          <p className="mt-1 text-sm text-ustawi-muted">Cases submitted by users appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <li key={item.id}>
                <Link
                  href={`/admin/support/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm transition hover:border-ustawi-navy/20 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">{item.case_number}</p>
                    <p className="mt-0.5 font-bold text-ustawi-navy">{item.subject}</p>
                    <p className="text-sm text-ustawi-muted">
                      {item.category.replace(/_/g, " ")} · Urgency {item.urgency} · {formatDate(item.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                    <ChevronRight className="h-5 w-5 text-ustawi-muted" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
