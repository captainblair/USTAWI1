import { MaintenanceDetailPanel } from "@/components/maintenance/maintenance-detail-panel";
import { MaintenanceShell } from "@/components/maintenance/maintenance-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Maintenance request",
    description: "View maintenance request details and status timeline.",
    path: `/maintenance/${id}`,
    noIndex: true,
  });
}

export default async function MaintenanceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <MaintenanceShell>
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <MaintenanceDetailPanel requestId={id} />
      </div>
    </MaintenanceShell>
  );
}
