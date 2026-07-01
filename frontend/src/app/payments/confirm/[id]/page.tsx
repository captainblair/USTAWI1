import { Suspense } from "react";
import { PaymentConfirmPanel } from "@/components/payments/payment-confirm-panel";
import { TenantShell } from "@/components/tenant/tenant-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return createPageMetadata({
    title: "Confirm payment",
    description: "Confirm your M-Pesa rent payment.",
    path: `/payments/confirm/${id}`,
    noIndex: true,
  });
}

export default async function PaymentConfirmPage({ params }: Props) {
  const { id } = await params;
  return (
    <TenantShell title="Confirm payment">
      <Suspense fallback={null}>
        <PaymentConfirmPanel paymentId={id} />
      </Suspense>
    </TenantShell>
  );
}
