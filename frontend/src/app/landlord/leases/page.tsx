import { LandlordLeasesPanel } from "@/components/landlord/landlord-leases-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Leases",
  description: "Sign and manage leases with your tenants.",
  path: "/landlord/leases",
  noIndex: true,
});

export default function LandlordLeasesPage() {
  return (
    <LandlordShell title="Leases">
      <p className="-mt-2 mb-5 text-sm text-ustawi-muted sm:mb-6">
        Review agreements, sign with tenants, and track active leases.
      </p>
      <LandlordLeasesPanel />
    </LandlordShell>
  );
}
