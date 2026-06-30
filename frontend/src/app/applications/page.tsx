import { ApplicationsListPanel } from "@/components/applications/applications-list-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "My applications",
  description: "Track your rental applications, screening scores, and landlord decisions on Ustawi.",
  path: "/applications",
  noIndex: true,
});

export default function ApplicationsPage() {
  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Tenant portal</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">My applications</h1>
          <p className="mt-2 text-ustawi-muted">
            Track status from draft through landlord review, with screening scores along the way.
          </p>
        </div>
        <ApplicationsListPanel />
      </div>
    </div>
  );
}
