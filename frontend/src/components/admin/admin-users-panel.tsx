"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminUsers } from "@/lib/api/admin-users";
import { isAdmin } from "@/lib/auth/constants";
import { USER_ROLE_META, USER_ROLE_OPTIONS } from "@/lib/auth/roles";
import type { AdminUserListItem } from "@/types/admin-users";
import type { UserRole } from "@/lib/auth/constants";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminUsersPanel() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchAdminUsers(accessToken, {
      role: roleFilter || undefined,
      search: search || undefined,
    });
    setItems(data.results);
    setCount(data.count);
  }, [accessToken, roleFilter, search]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/admin/users");
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
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router, user]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ustawi-muted">
          {count} user{count === 1 ? "" : "s"} on the platform
        </p>
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ustawi-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email, name, or phone"
            className="h-10 w-full rounded-xl border border-[#E8EAF2] bg-white pl-10 pr-4 text-sm"
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRoleFilter("")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold",
            !roleFilter
              ? "border-ustawi-navy bg-ustawi-navy text-white"
              : "border-[#E8EAF2] text-ustawi-navy hover:bg-ustawi-cream",
          )}
        >
          All roles
        </button>
        {USER_ROLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRoleFilter(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              roleFilter === option.value
                ? "border-ustawi-navy bg-ustawi-navy text-white"
                : "border-[#E8EAF2] text-ustawi-navy hover:bg-ustawi-cream",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8EAF2] bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-ustawi-muted">No users match your filters.</p>
        ) : (
          <ul className="divide-y divide-[#E8EAF2]">
            {items.map((item) => {
              const meta = USER_ROLE_META[item.role as UserRole];
              return (
                <li key={item.id}>
                  <Link
                    href={`/admin/users/${item.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-[#FAFBFE] sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ustawi-navy">
                        {item.full_name || item.email}
                      </p>
                      <p className="truncate text-sm text-ustawi-muted">{item.email}</p>
                      <p className="mt-1 text-xs text-ustawi-muted">
                        Joined {formatDate(item.created_at)}
                        {item.phone ? ` · ${item.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          meta?.className ?? "bg-gray-100 text-gray-800",
                        )}
                      >
                        {meta?.label ?? item.role}
                      </span>
                      {!item.is_active && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-ustawi-muted" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
