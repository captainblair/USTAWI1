import type { LucideIcon } from "lucide-react";
import { Bell, CreditCard, FileText, Wrench } from "lucide-react";
import type { NotificationCategory, NotificationItem } from "@/types/notifications";

export const NOTIFICATION_CATEGORY_TABS: {
  value: NotificationCategory | "";
  label: string;
  badgeKey?: keyof Pick<
    import("@/types/notifications").NotificationBadge,
    "applications" | "payments" | "maintenance" | "system"
  >;
}[] = [
  { value: "", label: "All" },
  { value: "APPLICATIONS", label: "Applications", badgeKey: "applications" },
  { value: "PAYMENTS", label: "Payments", badgeKey: "payments" },
  { value: "MAINTENANCE", label: "Maintenance", badgeKey: "maintenance" },
  { value: "SYSTEM", label: "System", badgeKey: "system" },
];

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: LucideIcon; iconClass: string }
> = {
  APPLICATIONS: {
    label: "Applications",
    icon: FileText,
    iconClass: "bg-blue-100 text-blue-700",
  },
  PAYMENTS: {
    label: "Payments",
    icon: CreditCard,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    iconClass: "bg-amber-100 text-amber-800",
  },
  SYSTEM: {
    label: "System",
    icon: Bell,
    iconClass: "bg-slate-100 text-slate-700",
  },
};

export function notificationActionLabel(item: NotificationItem): string {
  if (item.category === "APPLICATIONS") return "View application";
  if (item.category === "PAYMENTS") {
    return item.title.toLowerCase().includes("due") ? "Pay now" : "View payment";
  }
  if (item.category === "MAINTENANCE") return "View request";
  return "View details";
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - itemDay.getTime()) / 86400000);

  const time = date.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) {
    return date.toLocaleDateString("en-KE", { weekday: "short", hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function groupNotificationsByDay(items: NotificationItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayItems: NotificationItem[] = [];
  const earlierItems: NotificationItem[] = [];

  for (const item of items) {
    const d = new Date(item.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) todayItems.push(item);
    else earlierItems.push(item);
  }

  return { today: todayItems, earlier: earlierItems };
}
