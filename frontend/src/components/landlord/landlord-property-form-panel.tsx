"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLandlordProperty, updateLandlordProperty } from "@/lib/api/landlord-properties";
import {
  apiFieldHasError,
  defaultCoordsForNeighborhood,
  formatApiFieldErrors,
} from "@/lib/landlord/property-form";
import { PropertyListingSteps } from "@/components/landlord/property-listing-steps";
import type { LandlordPropertyCreatePayload } from "@/types/landlord";
import type { PropertyDetail } from "@/types/property";
import { ApiRequestError } from "@/types/api";
import { isLandlord } from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "PENTHOUSE",
  "TOWNHOUSE",
  "STUDIO",
  "BEDSITTER",
  "MAISONETTE",
] as const;

type Props = {
  mode: "create" | "edit";
  property?: PropertyDetail;
  onSaved?: () => void;
};

function fieldClass(hasError: boolean) {
  return cn(
    "h-11 rounded-lg border bg-white text-sm text-ustawi-navy focus:ring-2 focus:ring-ustawi-navy/10",
    hasError
      ? "border-red-400 focus:border-red-400"
      : "border-[#E8EAF2] focus:border-ustawi-navy/30",
  );
}

export function LandlordPropertyFormPanel({ mode, property, onSaved }: Props) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState(property?.title ?? "");
  const [description, setDescription] = useState(property?.description ?? "");
  const [propertyType, setPropertyType] = useState(property?.property_type ?? "APARTMENT");
  const [address, setAddress] = useState(property?.address ?? "");
  const [city, setCity] = useState(property?.city ?? "Nairobi");
  const [neighborhoodSlug, setNeighborhoodSlug] = useState(property?.neighborhood?.slug ?? "karen");
  const [priceMonthly, setPriceMonthly] = useState(property?.price_monthly ?? "");
  const [bedrooms, setBedrooms] = useState(String(property?.bedrooms ?? 2));
  const [bathrooms, setBathrooms] = useState(String(property?.bathrooms ?? 1));
  const [furnished, setFurnished] = useState(property?.furnished ?? false);
  const [latitude, setLatitude] = useState(
    String(property?.latitude ?? defaultCoordsForNeighborhood("karen").latitude),
  );
  const [longitude, setLongitude] = useState(
    String(property?.longitude ?? defaultCoordsForNeighborhood("karen").longitude),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  useEffect(() => {
    if (authLoading || mode !== "create") return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/landlord/properties/new");
      return;
    }
    if (!isLandlord(user)) {
      router.replace("/profile");
    }
  }, [accessToken, authLoading, isAuthenticated, mode, router, user]);

  useEffect(() => {
    if (mode === "create") {
      const coords = defaultCoordsForNeighborhood(neighborhoodSlug);
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
    }
  }, [mode, neighborhoodSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);

    if (authLoading) return;

    if (!accessToken) {
      setError("Your session expired. Please log in again.");
      router.replace("/login?next=/landlord/properties/new");
      return;
    }

    if (!isLandlord(user)) {
      setError("Only landlords and agents can create property listings.");
      return;
    }

    if (!title.trim() || !description.trim() || !address.trim() || !city.trim()) {
      setError("Please fill in title, description, address, and city.");
      return;
    }

    const rent = Number(priceMonthly);
    if (!Number.isFinite(rent) || rent <= 0) {
      setError("Enter a valid monthly rent greater than zero.");
      return;
    }

    setSaving(true);

    const normalizedSlug = neighborhoodSlug.trim().toLowerCase().replace(/\s+/g, "-");

    const payload: LandlordPropertyCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      property_type: propertyType,
      address: address.trim(),
      city: city.trim(),
      neighborhood_slug: normalizedSlug || undefined,
      price_monthly: rent,
      currency: "KES",
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      furnished,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    try {
      if (mode === "create") {
        const created = await createLandlordProperty(accessToken, payload);
        if (!created?.id) {
          throw new ApiRequestError("Property was created but the server did not return an id.", 500);
        }
        router.push(`/landlord/properties/${created.id}`);
        router.refresh();
      } else if (property) {
        await updateLandlordProperty(accessToken, property.id, payload);
        onSaved?.();
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFieldErrors(err.details);
        const formatted = formatApiFieldErrors(err.details as Record<string, unknown> | undefined);
        setError(formatted ?? err.message);
        if (err.status === 401) {
          router.replace("/login?next=/landlord/properties/new");
        }
      } else if (err instanceof Error) {
        setError(err.message || "Could not save property.");
      } else {
        setError("Could not save property.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (authLoading && mode === "create") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <>
      {mode === "create" && <PropertyListingSteps current={1} />}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-2xl border border-[#E8EAF2] bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="text-lg font-bold text-ustawi-navy">
          {mode === "create" ? "Step 1 — Listing details" : "Edit property"}
        </h2>
        <p className="mt-1 text-sm text-ustawi-muted">
          {mode === "create"
            ? "Enter the basics first. After you save, you’ll go to step 2 to upload photos."
            : "Update details while the listing is in draft, vacant, or rejected status."}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass(apiFieldHasError(fieldErrors, "title"))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={cn(fieldClass(apiFieldHasError(fieldErrors, "description")), "w-full resize-y py-2")}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={cn(fieldClass(apiFieldHasError(fieldErrors, "property_type")), "w-full px-3")}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Monthly rent (KES)</label>
              <Input
                type="number"
                min={0}
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                className={fieldClass(apiFieldHasError(fieldErrors, "price_monthly"))}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Address</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={fieldClass(apiFieldHasError(fieldErrors, "address"))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">City</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldClass(apiFieldHasError(fieldErrors, "city"))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Neighborhood slug</label>
              <Input
                value={neighborhoodSlug}
                onChange={(e) => setNeighborhoodSlug(e.target.value.toLowerCase())}
                className={fieldClass(apiFieldHasError(fieldErrors, "neighborhood_slug"))}
                placeholder="tilisi"
              />
              <p className="mt-1 text-xs text-ustawi-muted">
                Lowercase slug for search and map pin (e.g. karen, westlands, tilisi).
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Bedrooms</label>
              <Input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className={fieldClass(apiFieldHasError(fieldErrors, "bedrooms"))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ustawi-navy">Bathrooms</label>
              <Input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className={fieldClass(apiFieldHasError(fieldErrors, "bathrooms"))}
                required
              />
            </div>
          </div>
          <div className="rounded-xl border border-[#E8EAF2] bg-[#FAFBFE] p-4">
            <p className="text-sm font-semibold text-ustawi-navy">Map location</p>
            <p className="mt-0.5 text-xs text-ustawi-muted">
              Required by the API for search and maps. Auto-filled from neighborhood — adjust if needed.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ustawi-muted">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={fieldClass(apiFieldHasError(fieldErrors, "latitude"))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ustawi-muted">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={fieldClass(apiFieldHasError(fieldErrors, "longitude"))}
                  required
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ustawi-navy">
            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
            Furnished
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Save & continue to photos" : "Save changes"}
          </Button>
          <Link
            href={property ? `/landlord/properties/${property.id}` : "/landlord/properties"}
            className="inline-flex h-10 items-center rounded-lg border border-[#E8EAF2] px-4 text-sm font-semibold text-ustawi-navy hover:bg-ustawi-cream"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
