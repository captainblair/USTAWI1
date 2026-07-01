"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LandlordPropertyFormPanel } from "@/components/landlord/landlord-property-form-panel";
import { LandlordPropertyPhotos } from "@/components/landlord/landlord-property-photos";
import { PropertyListingSteps } from "@/components/landlord/property-listing-steps";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  fetchLandlordPropertyDetail,
  publishLandlordProperty,
} from "@/lib/api/landlord-properties";
import { isLandlord } from "@/lib/auth/constants";
import { formatPrice } from "@/lib/utils";
import type { PropertyDetail } from "@/types/property";
import { ApiRequestError } from "@/types/api";

export function LandlordPropertyDetailPanel({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchLandlordPropertyDetail(accessToken, propertyId);
    setProperty(data);
    return data;
  }, [accessToken, propertyId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/landlord/properties/${propertyId}`);
      return;
    }
    if (!isLandlord(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load property.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, propertyId, router, user]);

  async function handlePublish() {
    if (!accessToken) return;
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await publishLandlordProperty(accessToken, propertyId);
      await load();
      setMessage(res.message ?? "Property published.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not publish.");
    } finally {
      setPublishing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error && !property) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!property) return null;

  const canEdit = ["DRAFT", "VACANT", "REJECTED"].includes(property.status);
  const canPublish = ["DRAFT", "REJECTED", "VACANT"].includes(property.status);
  const hasImages = (property.images?.length ?? 0) > 0;

  if (editing && canEdit) {
    return (
      <LandlordPropertyFormPanel
        mode="edit"
        property={property}
        onSaved={async () => {
          setEditing(false);
          await load();
          setMessage("Property updated.");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PropertyListingSteps current={canPublish && hasImages ? 3 : 2} />
      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted capitalize">
              {property.status.toLowerCase().replace(/_/g, " ")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ustawi-navy">{property.title}</h2>
            <p className="mt-1 text-sm text-ustawi-muted">
              {property.address}, {property.city} · {formatPrice(property.price_monthly, property.currency)}/mo
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit details
              </Button>
            )}
            {property.status === "ACTIVE" && property.slug && (
              <Link
                href={`/properties/${property.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
              >
                View public listing
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {accessToken && (
          <LandlordPropertyPhotos
            propertyId={propertyId}
            accessToken={accessToken}
            images={property.images ?? []}
            title={property.title}
            onChange={async () => {
              await load();
            }}
          />
        )}

        <div className="mt-6 border-t border-[#E8EAF2] pt-6">
          <h3 className="text-sm font-bold text-ustawi-navy">
            {hasImages ? "Step 3 — Publish" : "Finish photos to publish"}
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ustawi-muted">
            <li className={hasImages ? "text-emerald-700" : "font-medium text-ustawi-navy"}>
              {hasImages ? "✓ At least one photo uploaded" : "Upload main + gallery photos"}
            </li>
            <li className={property.title ? "text-emerald-700" : ""}>
              {property.title ? "✓ Details saved" : "Listing details"}
            </li>
            <li className={property.status === "ACTIVE" ? "text-emerald-700" : ""}>
              {property.status === "ACTIVE" ? "✓ Published and live" : "Publish for tenants to search and apply"}
            </li>
          </ol>

          {canPublish && (
            <Button
              type="button"
              className="mt-5 w-full bg-[#EF3D32] hover:bg-[#EF3D32]/90 sm:w-auto"
              disabled={publishing || !hasImages}
              onClick={handlePublish}
            >
              {publishing ? "Publishing…" : "Publish listing"}
            </Button>
          )}

          {!hasImages && canPublish && (
            <p className="mt-2 text-xs text-ustawi-muted">Add at least one photo before publishing.</p>
          )}

          {property.status === "ACTIVE" && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Live on Ustawi — tenants can find and apply for this property.
            </p>
          )}
        </div>

        {message && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
  );
}
