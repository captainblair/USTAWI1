import { LandlordAddPropertyButton, LandlordShell } from "@/components/landlord/landlord-shell";
import { LandlordDashboardPanel } from "@/components/landlord/landlord-dashboard-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Landlord dashboard",
  description: "Manage properties, applications, and leases on Ustawi.",
  path: "/landlord",
  noIndex: true,
});

export default function LandlordDashboardPage() {
  return (
    <LandlordShell title="Overview" action={<LandlordAddPropertyButton />}>
      <LandlordDashboardPanel />
    </LandlordShell>
  );
}
