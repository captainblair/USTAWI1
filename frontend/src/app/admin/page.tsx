import { AdminDashboardPanel } from "@/components/admin/admin-dashboard-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Admin dashboard",
  description: "Ustawi platform admin overview — users, listings, revenue, and verification metrics.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <AdminShell title="Overview">
      <AdminDashboardPanel />
    </AdminShell>
  );
}
