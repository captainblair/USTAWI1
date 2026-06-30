"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ApplicationStatusBadge,
  ScreeningScoreBadge,
} from "@/components/applications/application-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchMyApplications } from "@/lib/api/applications";
import { isTenant } from "@/lib/auth/constants";
import { propertyImageSrc } from "@/lib/media-url";
import { formatPrice } from "@/lib/utils";
import type { ApplicationListItem, ApplicationStatus } from "@/types/application";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "In review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function ApplicationsListPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState<ApplicationListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/applications");
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
        const data = await fetchMyApplications(accessToken!, statusFilter || undefined);
        if (!cancelled) {
          setItems(data.results);
          setCount(data.count);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load applications.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router, statusFilter, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
              statusFilter === tab.value
                ? "border-ustawi-navy bg-ustawi-navy text-white"
                : "border-ustawi-border bg-white text-ustawi-navy hover:bg-ustawi-cream",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-ustawi-border bg-white p-10 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-ustawi-muted/50" />
          <h2 className="mt-4 text-xl font-bold text-ustawi-navy">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ustawi-muted">
            Browse listings and tap Apply now on a property you love.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white shadow-ustawi-red"
          >
            Browse properties
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-ustawi-muted">
            {count} application{count === 1 ? "" : "s"}
          </p>
          <div className="space-y-4">
            {items.map((app) => {
              const prop = app.property;
              const location = prop.neighborhood
                ? `${prop.neighborhood.name}, ${prop.city}`
                : prop.city;

              return (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex flex-col gap-4 rounded-2xl border border-ustawi-border bg-white p-4 shadow-sm transition hover:border-ustawi-navy/20 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-ustawi-sand sm:h-20 sm:w-28">
                    <Image
                      src={propertyImageSrc(prop.primary_image)}
                      alt={prop.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ustawi-navy">{prop.title}</h3>
                      <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                    </div>
                    <p className="mt-1 text-sm text-ustawi-muted">{location}</p>
                    <p className="mt-1 text-sm font-semibold text-ustawi-navy">
                      {formatPrice(prop.price_monthly, prop.currency)}/mo
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    {app.status !== "DRAFT" && app.screening_score > 0 && (
                      <ScreeningScoreBadge score={app.screening_score} label={app.screening_label} />
                    )}
                    {app.submitted_at && (
                      <p className="text-xs text-ustawi-muted">
                        Submitted {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                    <span className="text-sm font-semibold text-ustawi-red">View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
