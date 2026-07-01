import { LeaseDetailPanel } from "@/components/leases/lease-detail-panel";
import { LeasesShell } from "@/components/leases/leases-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Lease details",
    description: "Review lease terms, sign documents, and download your signed agreement.",
    path: `/leases/${id}`,
    noIndex: true,
  });
}

export default async function LeaseDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <LeasesShell>
      <LeaseDetailPanel leaseId={id} />
    </LeasesShell>
  );
}
