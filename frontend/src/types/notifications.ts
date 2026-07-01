export type NotificationCategory = "APPLICATIONS" | "PAYMENTS" | "MAINTENANCE" | "SYSTEM";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  reference_type: string;
  reference_id: string | null;
  action_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificationBadge = {
  total: number;
  applications: number;
  payments: number;
  maintenance: number;
  system: number;
  by_category: { category: NotificationCategory; count: number }[];
};

export type NotificationsListResponse = {
  success: true;
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
  badge: NotificationBadge;
};

export type ActivityEvent = {
  id: string;
  category: NotificationCategory;
  event_type: string;
  title: string;
  description: string;
  reference_type: string;
  reference_id: string | null;
  actor_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
