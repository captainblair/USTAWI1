"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotificationBadge } from "@/hooks/use-notification-badge";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  className?: string;
  iconClassName?: string;
  variant?: "light" | "dark";
};

export function NotificationBell({ className, iconClassName, variant = "dark" }: NotificationBellProps) {
  const { data: badge } = useNotificationBadge();
  const count = badge?.total ?? 0;

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition",
        variant === "dark" && "text-white hover:bg-white/10",
        variant === "light" && "text-ustawi-muted hover:bg-ustawi-cream hover:text-ustawi-navy",
        className,
      )}
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <Bell className={cn("h-5 w-5", iconClassName)} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EF3D32] px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
