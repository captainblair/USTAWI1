"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchInspectorQueue } from "@/lib/api/inspector-verification";
import { isInspectorOrAdmin } from "@/lib/auth/constants";
import { VERIFICATION_QUEUE_TABS, VERIFICATION_STATUS_META, formatVerificationDate } from "@/lib/verification/status";
import type { VerificationCaseListItem } from "@/types/verification";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

export function InspectorQueuePanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState<VerificationCaseListItem[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchInspectorQueue(accessToken, tab);
    setItems(data.results);
    setTabCounts(data.tab_counts);
  }, [accessToken, tab]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/inspector");
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
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load queue.");
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
      <p className="text-sm text-ustawi-muted">
        Review landlord documents, score property safety, and approve or reject listings.
      </p>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex max-w-full gap-2 pb-1">
          {VERIFICATION_QUEUE_TABS.map((t) => (
            <button
              key={t.value}
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
              {tabCounts[t.value as keyof typeof tabCounts] !== undefined && (
                <span className="ml-1.5 text-xs opacity-80">{tabCounts[t.value as keyof typeof tabCounts]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-ustawi-muted/40" />
          <p className="mt-3 font-semibold text-ustawi-navy">No cases in this queue</p>
          <p className="mt-1 text-sm text-ustawi-muted">New submissions appear when landlords publish properties.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = VERIFICATION_STATUS_META[item.status];
            return (
              <li key={item.id}>
                <Link
                  href={`/inspector/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EAF2] bg-white p-4 shadow-sm transition hover:border-ustawi-navy/20 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-ustawi-navy">{item.property_title}</p>
                    <p className="text-sm text-ustawi-muted">
                      {item.owner_name} · {item.property_location}
                    </p>
                    <p className="mt-1 text-xs text-ustawi-muted">
                      {formatVerificationDate(item.submitted_at)} · Safety {item.safety_score}/10
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
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
