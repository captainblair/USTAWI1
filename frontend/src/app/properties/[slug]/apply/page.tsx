import { ApplicationFormPanel } from "@/components/applications/application-form-panel";
import { PropertyDetailShell } from "@/components/properties/property-detail-shell";
import { createPageMetadata } from "@/lib/seo/metadata";
type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return createPageMetadata({
    title: "Apply for this home",
    description: "Submit your rental application for this Ustawi listing.",
    path: `/properties/${slug}/apply`,
    noIndex: true,
  });
}

export default async function PropertyApplyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <PropertyDetailShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Rental application</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Apply for this home</h1>
          <p className="mt-2 text-ustawi-muted">
            Complete your details and upload documents. Save as draft or submit when ready.
          </p>
        </div>
        <ApplicationFormPanel propertySlug={slug} />
      </div>
    </PropertyDetailShell>
  );}
