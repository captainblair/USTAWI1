import { LandlordMaintenanceDetailPanel } from "@/components/landlord/landlord-maintenance-detail-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Maintenance triage",
    description: "Assign technician and update maintenance request status.",
    path: `/landlord/maintenance/${id}`,
    noIndex: true,
  });
}

export default async function LandlordMaintenanceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <LandlordShell title="">
      <LandlordMaintenanceDetailPanel requestId={id} />
    </LandlordShell>
  );
}
