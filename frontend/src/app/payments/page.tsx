import { Suspense } from "react";
import { PaymentsBillingPanel } from "@/components/payments/payments-billing-panel";
import { TenantShell } from "@/components/tenant/tenant-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Payments & billing",
  description: "Pay rent via M-Pesa, view invoices, and download payment receipts on Ustawi.",
  path: "/payments",
  noIndex: true,
});

export default function PaymentsPage() {
  return (
    <TenantShell title="Payments & billing">
      <Suspense fallback={null}>
        <PaymentsBillingPanel />
      </Suspense>
    </TenantShell>
  );
}
