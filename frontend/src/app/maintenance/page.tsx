import { MaintenancePanel } from "@/components/maintenance/maintenance-panel";
import { MaintenanceShell } from "@/components/maintenance/maintenance-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Maintenance requests",
  description: "Report maintenance issues and track repair status on Ustawi.",
  path: "/maintenance",
  noIndex: true,
});

export default function MaintenancePage() {
  return (
    <MaintenanceShell>
      <div className="mx-auto w-full min-w-0 max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <h1 className="text-xl font-bold text-ustawi-navy sm:text-2xl">Maintenance requests</h1>
        <p className="mt-1.5 text-sm text-ustawi-muted sm:mt-2">
          Submit issues for your rental and track progress through completion.
        </p>
        <div className="mt-6 sm:mt-8">
          <MaintenancePanel />
        </div>
      </div>
    </MaintenanceShell>
  );
}
