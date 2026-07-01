import { TenantDashboardPanel } from "@/components/tenant/tenant-dashboard-panel";
import { TenantShell } from "@/components/tenant/tenant-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Tenant dashboard",
  description: "Your Ustawi home — active lease, upcoming rent, applications, and property recommendations.",
  path: "/dashboard",
  noIndex: true,
});

export default function TenantDashboardPage() {
  return (
    <TenantShell title="Overview">
      <TenantDashboardPanel />
    </TenantShell>
  );
}
