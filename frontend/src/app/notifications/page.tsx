import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { NotificationsShell } from "@/components/notifications/notifications-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Notifications center",
  description: "View and manage your Ustawi alerts for applications, payments, and maintenance.",
  path: "/notifications",
  noIndex: true,
});

export default function NotificationsPage() {
  return (
    <NotificationsShell>
      <div className="mx-auto w-full min-w-0 max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <NotificationsPanel />
      </div>
    </NotificationsShell>
  );
}
