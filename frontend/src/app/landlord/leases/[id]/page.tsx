import { LandlordLeaseDetailPanel } from "@/components/landlord/landlord-lease-detail-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Lease details",
    description: "Review the lease agreement and sign with your tenant.",
    path: `/landlord/leases/${id}`,
    noIndex: true,
  });
}

export default async function LandlordLeaseDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <LandlordShell title="">
      <LandlordLeaseDetailPanel leaseId={id} />
    </LandlordShell>
  );
}
