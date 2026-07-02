import { LandlordApplicationDetailPanel } from "@/components/landlord/landlord-application-detail-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Application review",
    description: "Review tenant application details, screening score, and documents.",
    path: `/landlord/applications/${id}`,
    noIndex: true,
  });
}

export default async function LandlordApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <LandlordShell title="">
      <LandlordApplicationDetailPanel applicationId={id} />
    </LandlordShell>
  );
}
