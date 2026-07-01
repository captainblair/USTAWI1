import { LeasesListPanel } from "@/components/leases/leases-list-panel";
import { LeasesShell } from "@/components/leases/leases-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "My leases & contracts",
  description: "View, sign, and manage your rental leases and contracts on Ustawi.",
  path: "/leases",
  noIndex: true,
});

export default function LeasesPage() {
  return (
    <LeasesShell>
      <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8 lg:max-w-4xl lg:px-8 lg:py-10">
        <h1 className="text-xl font-bold text-ustawi-navy sm:text-2xl lg:text-3xl">My leases &amp; contracts</h1>
        <p className="mt-1.5 text-sm text-ustawi-muted sm:mt-2">
          Active leases, pending signatures, and signed documents in one place.
        </p>
        <div className="mt-6 sm:mt-8">
          <LeasesListPanel />
        </div>
      </div>
    </LeasesShell>
  );
}
