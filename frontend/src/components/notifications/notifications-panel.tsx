"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Search, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCategoryTabs } from "@/components/notifications/notification-category-tabs";
import { NotificationDetailSidebar } from "@/components/notifications/notification-detail-sidebar";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import { useAuth } from "@/components/providers/auth-provider";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { groupNotificationsByDay } from "@/lib/notifications/status";
import { NOTIFICATION_BADGE_QUERY_KEY } from "@/hooks/use-notification-badge";
import type { NotificationBadge, NotificationItem } from "@/types/notifications";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

export function NotificationsPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [badge, setBadge] = useState<NotificationBadge | undefined>();
  const [category, setCategory] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await fetchNotifications(accessToken, {
      category: category || undefined,
      unread: unreadOnly || undefined,
    });
    setItems(data.results);
    setBadge(data.badge);
    return data.results;
  }, [accessToken, category, unreadOnly]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/notifications");
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const results = await load();
        if (!cancelled && results?.length) {
          setSelectedId((prev) => prev ?? results.find((n) => !n.is_read)?.id ?? results[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, isAuthenticated, load, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => groupNotificationsByDay(filtered), [filtered]);
  const selected = filtered.find((n) => n.id === selectedId) ?? items.find((n) => n.id === selectedId) ?? null;

  async function handleSelect(item: NotificationItem) {
    setSelectedId(item.id);
    if (!item.is_read && accessToken) {
      try {
        const updated = await markNotificationRead(accessToken, item.id);
        setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_BADGE_QUERY_KEY });
        const data = await fetchNotifications(accessToken, {
          category: category || undefined,
          unread: unreadOnly || undefined,
        });
        setBadge(data.badge);
      } catch {
        // Selection still works if mark-read fails.
      }
    }
  }

  async function handleMarkAllRead() {
    if (!accessToken || !badge?.total) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(accessToken);
      await load();
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_BADGE_QUERY_KEY });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      </div>
    );
  }

  function renderGroup(title: string, groupItems: NotificationItem[]) {
    if (groupItems.length === 0) return null;
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ustawi-muted">{title}</h3>
        <ul className="space-y-3">
          {groupItems.map((item) => (
            <li key={item.id}>
              <div className="lg:hidden">
                <NotificationListItem item={item} />
              </div>
              <div className="hidden lg:block">
                <NotificationListItem
                  item={item}
                  compact
                  selected={selectedId === item.id}
                  onSelect={() => handleSelect(item)}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ustawi-navy sm:text-2xl">Notifications Center</h1>
          <p className="mt-1 text-sm text-ustawi-muted">Alerts for applications, payments, maintenance, and more.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || !badge?.total}
            className="text-sm font-semibold text-ustawi-navy hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
          <Link
            href="/profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8EAF2] text-ustawi-muted hover:bg-ustawi-cream hover:text-ustawi-navy"
            aria-label="Notification settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ustawi-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications…"
          className="h-11 w-full rounded-full border border-[#E8EAF2] bg-white pl-10 pr-4 text-sm outline-none focus:border-ustawi-navy/30"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <NotificationCategoryTabs value={category} onChange={setCategory} badge={badge} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
            unreadOnly
              ? "border-ustawi-navy bg-ustawi-navy text-white"
              : "border-[#E8EAF2] bg-white text-ustawi-navy hover:bg-ustawi-cream",
          )}
        >
          Unread
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-8">
        <div className="min-w-0 space-y-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#E8EAF2] bg-white p-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-ustawi-muted/40" />
              <p className="mt-3 font-semibold text-ustawi-navy">No notifications</p>
              <p className="mt-1 text-sm text-ustawi-muted">
                {unreadOnly ? "You are all caught up." : "Updates about your account will appear here."}
              </p>
            </div>
          ) : (
            <>
              {renderGroup("Today", grouped.today)}
              {renderGroup("Earlier", grouped.earlier)}
            </>
          )}
        </div>

        <div className="hidden lg:block">
          <NotificationDetailSidebar item={selected} />
        </div>
      </div>
    </div>
  );
}
