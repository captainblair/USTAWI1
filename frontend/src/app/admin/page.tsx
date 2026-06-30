import { AdminDashboardPanel } from "@/components/admin/admin-dashboard-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Admin dashboard",
  description: "Ustawi platform admin overview — users, listings, revenue, and verification metrics.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-ustawi-muted">Platform-wide metrics and quick links for Ustawi administrators.</p>
        </div>
        <AdminDashboardPanel />
      </div>
    </div>
  );
}
