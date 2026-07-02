"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProfile, updateProfile, uploadProfileAvatar } from "@/lib/api/profile";
import { fetchCurrentUser } from "@/lib/api/auth";
import { setClientSession, getClientSession } from "@/lib/auth/session";
import { mapUserFromApi } from "@/lib/auth/map-user";
import type { UserProfile } from "@/types/profile";
import { ApiRequestError } from "@/types/api";const inputClass =
  "h-11 rounded-lg border-[#E8EAF2] bg-white text-sm text-ustawi-navy placeholder:text-ustawi-muted/60 focus:border-ustawi-navy/30 focus:ring-2 focus:ring-ustawi-navy/10";

export function ProfilePanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading, setSession } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/profile");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchProfile(accessToken!);
        if (cancelled) return;
        setProfile(data);
        setFullName(data.full_name ?? "");
        setCity(data.city ?? "");
        setCountry(data.country ?? "");
        setAddress(data.address ?? "");
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : "Could not load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a JPG or PNG image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadingAvatar(true);
    setPhotoError(null);
    setPhotoSuccess(null);

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localPreview;
    });

    try {
      const updated = await uploadProfileAvatar(accessToken, file);
      if (!updated.avatar) {
        throw new ApiRequestError("Photo was not saved on the server. Please try again.", 500);
      }

      setProfile(updated);
      setPhotoSuccess("Profile photo saved. It also updates in the top navigation bar.");

      const session = getClientSession();
      if (session) {
        const apiUser = await fetchCurrentUser(accessToken);
        const nextSession = {
          ...session,
          user: mapUserFromApi(apiUser),
        };
        setClientSession(nextSession);
        setSession(nextSession);
      }
    } catch (err) {
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPhotoError(err instanceof ApiRequestError ? err.message : "Could not upload photo.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const updated = await updateProfile(accessToken, {
        full_name: fullName.trim(),
        city: city.trim(),
        country: country.trim(),
        address: address.trim(),
      });
      setProfile(updated);

      const session = getClientSession();
      if (session && user) {
        const nextSession = {
          ...session,
          user: { ...user, full_name: updated.full_name },
        };
        setClientSession(nextSession);
        setSession(nextSession);
      }

      setFormSuccess("Details saved.");
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="animate-pulse space-y-4 rounded-2xl border border-ustawi-border bg-white p-8">
        <div className="h-8 w-48 rounded bg-ustawi-sand" />
        <div className="h-11 rounded bg-ustawi-sand" />
        <div className="h-11 rounded bg-ustawi-sand" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {loadError ?? "Profile unavailable."}
      </div>
    );
  }

  const roleLabel = profile.role.charAt(0) + profile.role.slice(1).toLowerCase();
  const initials =
    profile.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? profile.email[0]?.toUpperCase() ?? "U";
  const avatarVersion = profile.updated_at ?? String(Date.now());

  function clearAvatarPreview() {
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-ustawi-navy">Profile photo</h2>
          <p className="mt-1 text-sm text-ustawi-muted">
            Uploads immediately when you choose a file — no need to click Save changes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <ProfileAvatar
              src={profile.avatar}
              previewSrc={avatarPreview}
              version={avatarVersion}
              initials={initials}
              size="xl"
              onServerLoad={clearAvatarPreview}
              onServerError={() => {
                setPhotoSuccess(null);
                setPhotoError(
                  "Photo was saved but the image file is missing on the server. Re-upload after storage is configured.",
                );
              }}
            />
            <div>
              <p className="text-sm font-semibold text-ustawi-navy">Your photo</p>
              <p className="mt-0.5 text-xs text-ustawi-muted">JPG, PNG, or WebP · max 5 MB</p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Uploading…" : "Choose photo"}
              </Button>
            </div>
          </div>

          {photoSuccess && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {photoSuccess}
            </p>
          )}
          {photoError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{photoError}</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-lg font-bold text-ustawi-navy">Personal details</h2>
          <p className="mt-1 text-sm text-ustawi-muted">Update how your name and location appear on Ustawi.</p>

          <div className="mt-6 space-y-4">
          <div>            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
              Full name
            </label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-city" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                City
              </label>
              <Input
                id="profile-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-country" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Country
              </label>
              <Input
                id="profile-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-address" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
              Address
            </label>
            <Input
              id="profile-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
        </div>

        {formError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
        )}
        {formSuccess && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {formSuccess}
          </p>
        )}

        <Button type="submit" disabled={saving} className="mt-6">
          {saving ? "Saving…" : "Save changes"}
        </Button>
        </form>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={profile.avatar}
              previewSrc={avatarPreview}
              version={avatarVersion}
              initials={initials}
              size="md"
              onServerLoad={clearAvatarPreview}
            />
            <div>              <p className="font-semibold text-ustawi-navy">{profile.full_name || profile.email}</p>
              <p className="text-sm capitalize text-ustawi-muted">{roleLabel}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-ustawi-muted">Email</dt>
              <dd className="font-medium text-ustawi-navy">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-ustawi-muted">Phone</dt>
              <dd className="font-medium text-ustawi-navy">{profile.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ustawi-navy">
            <ShieldCheck className="h-4 w-4 text-ustawi-red" />
            Verification
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-ustawi-muted">
            <li>{profile.is_phone_verified ? "✓ Phone verified" : "○ Phone not verified"}</li>
            <li>{profile.is_email_verified ? "✓ Email verified" : "○ Email not verified"}</li>
            <li>{profile.id_document_verified ? "✓ ID verified" : "○ ID not verified"}</li>
          </ul>
        </div>

        {profile.role === "TENANT" && (
          <>
            <Link
              href="/leases"
              className="block rounded-2xl border border-ustawi-navy/15 bg-ustawi-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ustawi-navy/90"
            >
              My leases
            </Link>
            <Link
              href="/maintenance"
              className="block rounded-2xl border border-ustawi-navy/15 bg-ustawi-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ustawi-navy/90"
            >
              Maintenance requests
            </Link>
            <Link
              href="/applications"
              className="block rounded-2xl border border-ustawi-navy/15 bg-ustawi-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ustawi-navy/90"
            >
              My applications
            </Link>
            <Link
              href="/saved"
              className="block rounded-2xl border border-ustawi-border bg-ustawi-cream px-4 py-3 text-center text-sm font-semibold text-ustawi-navy hover:bg-white"
            >
              View saved properties
            </Link>
          </>
        )}

        {(profile.role === "LANDLORD" || profile.role === "AGENT") && (
          <>
            <Link
              href="/landlord"
              className="block rounded-2xl border border-ustawi-navy/15 bg-ustawi-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ustawi-navy/90"
            >
              Landlord dashboard
            </Link>
            <Link
              href="/landlord/properties/new"
              className="block rounded-2xl border border-ustawi-border bg-ustawi-cream px-4 py-3 text-center text-sm font-semibold text-ustawi-navy hover:bg-white"
            >
              Add property
            </Link>
          </>
        )}

        {profile.role === "ADMIN" && (
          <Link
            href="/admin"
            className="block rounded-2xl border border-ustawi-navy/15 bg-ustawi-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ustawi-navy/90"
          >
            Open admin dashboard
          </Link>
        )}
      </aside>
    </div>
  );
}
