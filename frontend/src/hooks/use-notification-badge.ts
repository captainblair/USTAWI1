"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchNotificationBadge } from "@/lib/api/notifications";

export const NOTIFICATION_BADGE_QUERY_KEY = ["notification-badge"] as const;

export function useNotificationBadge() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: NOTIFICATION_BADGE_QUERY_KEY,
    queryFn: () => fetchNotificationBadge(accessToken!),
    enabled: isAuthenticated && Boolean(accessToken),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
