"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Home, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchLandlordProperties } from "@/lib/api/landlord-properties";
import { isLandlord } from "@/lib/auth/constants";
import { formatPrice } from "@/lib/utils";
import type { PropertyListItem } from "@/types/property";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-900",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  OCCUPIED: "bg-blue-50 text-blue-800",
  VACANT: "bg-orange-50 text-orange-900",
  REJECTED: "bg-red-50 text-red-800",
};

export function LandlordPropertiesPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/properties");
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
        const data = await fetchLandlordProperties(accessToken!);
        if (!cancelled) setItems(data.results);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load properties.");
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

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {items.length === 0 && !error && (
        <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
          <Home className="mx-auto h-10 w-10 text-ustawi-muted/50" />
          <p className="mt-4 font-semibold text-ustawi-navy">No properties yet</p>
          <p className="mt-1 text-sm text-ustawi-muted">Create your first listing to start receiving applications.</p>
          <Link
            href="/landlord/properties/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#EF3D32] px-5 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((prop) => (
          <li key={prop.id}>
            <Link
              href={`/landlord/properties/${prop.id}`}
              className="flex items-center gap-4 rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm hover:border-ustawi-navy/20"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E8EAF2]">
                <Home className="h-6 w-6 text-ustawi-navy/40" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ustawi-navy">{prop.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                      STATUS_STYLES[prop.status] ?? "bg-slate-100 text-slate-700",
                    )}
                  >
                    {prop.status.toLowerCase().replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-ustawi-muted">{prop.address}, {prop.city}</p>
                <p className="mt-1 text-sm font-semibold text-ustawi-navy">
                  {formatPrice(prop.price_monthly, prop.currency)}/mo · {prop.bedrooms} bed
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-ustawi-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
