import { LandlordPropertyDetailPanel } from "@/components/landlord/landlord-property-detail-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Manage property",
    description: "Upload photos and publish your property listing.",
    path: `/landlord/properties/${id}`,
    noIndex: true,
  });
}

export default async function LandlordPropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <LandlordShell title="Manage property">
      <LandlordPropertyDetailPanel propertyId={id} />
    </LandlordShell>
  );
}
