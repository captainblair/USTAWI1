import { ApplicationSuccessPanel } from "@/components/applications/application-success-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Application submitted",
    description: "Your rental application was submitted successfully.",
    path: `/applications/${id}/success`,
    noIndex: true,
  });
}

export default async function ApplicationSuccessPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="bg-ustawi-cream py-10 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ApplicationSuccessPanel applicationId={id} />
      </div>
    </div>
  );
}
