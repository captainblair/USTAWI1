import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplicationDetailPanel } from "@/components/applications/application-detail-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Application details",
    description: "View your rental application status, documents, and timeline.",
    path: `/applications/${id}`,
    noIndex: true,
  });
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/applications"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ustawi-muted hover:text-ustawi-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>
        <ApplicationDetailPanel applicationId={id} />
      </div>
    </div>
  );
}
