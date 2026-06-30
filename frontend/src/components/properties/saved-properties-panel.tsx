"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { SavedPropertiesGuestPrompt, SavedPropertiesRoleNotice } from "@/components/properties/save-property-button";
import { useAuth } from "@/components/providers/auth-provider";
import { useSavedProperties } from "@/hooks/use-saved-properties";

export function SavedPropertiesPanel() {
  const { user, isAuthenticated, canSave, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError, error } = useSavedProperties();

  if (authLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-ustawi-sand" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SavedPropertiesGuestPrompt />;
  }

  if (!canSave) {
    return <SavedPropertiesRoleNotice role={user?.role ?? "USER"} />;
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-ustawi-sand" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-ustawi-border bg-white p-8 text-center">
        <p className="text-sm text-ustawi-muted">
          {(error as Error)?.message ?? "Could not load saved properties."}
        </p>
      </div>
    );
  }

  const items = data?.results ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ustawi-border bg-white p-10 text-center shadow-sm">
        <Heart className="mx-auto h-10 w-10 text-ustawi-muted/50" />
        <h2 className="mt-4 text-xl font-bold text-ustawi-navy">No saved homes yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ustawi-muted">
          Tap the heart on any listing to save it here for easy comparison.
        </p>
        <Link
          href="/properties"
          className="mt-6 inline-flex rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white shadow-ustawi-red"
        >
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-ustawi-muted">
        {data?.count ?? items.length} saved {data?.count === 1 ? "home" : "homes"}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PropertyCard key={item.id} property={item.property} initialSaved />
        ))}
      </div>
    </>
  );
}
