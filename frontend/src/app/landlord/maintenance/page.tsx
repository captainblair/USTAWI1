import { LandlordMaintenanceInboxPanel } from "@/components/landlord/landlord-maintenance-inbox-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Maintenance inbox",
  description: "Triage tenant maintenance requests and assign technicians.",
  path: "/landlord/maintenance",
  noIndex: true,
});

export default function LandlordMaintenancePage() {
  return (
    <LandlordShell title="Maintenance inbox">
      <p className="-mt-2 mb-5 text-sm text-ustawi-muted sm:mb-6">
        Review requests, assign technicians, and update status through completion.
      </p>
      <LandlordMaintenanceInboxPanel />
    </LandlordShell>
  );
}
