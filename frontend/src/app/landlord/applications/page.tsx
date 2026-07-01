import { LandlordApplicationsPanel } from "@/components/landlord/landlord-applications-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Applications inbox",
  description: "Review and approve tenant rental applications.",
  path: "/landlord/applications",
  noIndex: true,
});

export default function LandlordApplicationsPage() {
  return (
    <LandlordShell title="Applications">
      <LandlordApplicationsPanel />
    </LandlordShell>
  );
}
