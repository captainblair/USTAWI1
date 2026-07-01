"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchAdminUser, updateAdminUserRole } from "@/lib/api/admin-users";
import { isAdmin, type UserRole } from "@/lib/auth/constants";
import { USER_ROLE_META, USER_ROLE_OPTIONS } from "@/lib/auth/roles";
import type { AdminUserDetail } from "@/types/admin-users";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUserDetailPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: currentUser, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("TENANT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchAdminUser(accessToken, userId);
    setDetail(data);
    setSelectedRole(data.role);
  }, [accessToken, userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/admin/users/${userId}`);
      return;
    }
    if (!isAdmin(currentUser)) {
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
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load user.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, currentUser, isAuthenticated, load, router, userId]);

  async function handleSaveRole() {
    if (!accessToken || !detail) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateAdminUserRole(accessToken, userId, selectedRole);
      setDetail(updated);
      setSuccess("Role updated successfully.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update role.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error}
        <Link href="/admin/users" className="mt-4 block font-semibold text-ustawi-navy hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  if (!detail) return null;

  const roleMeta = USER_ROLE_META[detail.role];
  const isSelf = currentUser?.id === detail.id;
  const roleChanged = selectedRole !== detail.role;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        All users
      </Link>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ustawi-navy">{detail.full_name || detail.email}</h2>
            <p className="mt-1 text-sm text-ustawi-muted">{detail.email}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              roleMeta?.className ?? "bg-gray-100 text-gray-800",
            )}
          >
            {roleMeta?.label ?? detail.role}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Phone</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Location</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">
              {[detail.city, detail.country].filter(Boolean).join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Email verified</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.is_email_verified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Phone verified</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.is_phone_verified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">ID verified</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.id_document_verified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Account status</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.is_active ? "Active" : "Inactive"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Joined</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{formatDateTime(detail.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Last login</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{formatDateTime(detail.last_login)}</dd>
          </div>
        </dl>

        {detail.address && (
          <div className="mt-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ustawi-muted">Address</dt>
            <dd className="mt-1 text-sm text-ustawi-navy">{detail.address}</dd>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#E8EAF2] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-bold text-ustawi-navy">Change role</h3>
        <p className="mt-1 text-sm text-ustawi-muted">
          Assign tenant, landlord, agent, inspector, or admin access. Admins can manage the full platform.
        </p>

        {isSelf && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This is your account — you cannot remove your own admin role.
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-ustawi-navy" htmlFor="user-role">
          Role
        </label>
        <select
          id="user-role"
          value={selectedRole}
          disabled={isSelf}
          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          className="mt-2 w-full max-w-sm rounded-xl border border-[#E8EAF2] bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {USER_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && detail && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <Check className="h-4 w-4 shrink-0" />
            {success}
          </p>
        )}

        <Button
          type="button"
          disabled={saving || !roleChanged || isSelf}
          className="mt-4 rounded-xl bg-ustawi-navy"
          onClick={handleSaveRole}
        >
          {saving ? "Saving…" : "Save role"}
        </Button>
      </div>
    </div>
  );
}
