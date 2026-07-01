import { LandlordPaymentsPanel } from "@/components/landlord/landlord-payments-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Payments collected",
  description: "View rent collected from tenants via M-Pesa.",
  path: "/landlord/payments",
  noIndex: true,
});

export default function LandlordPaymentsPage() {
  return (
    <LandlordShell title="Payments">
      <LandlordPaymentsPanel />
    </LandlordShell>
  );
}
