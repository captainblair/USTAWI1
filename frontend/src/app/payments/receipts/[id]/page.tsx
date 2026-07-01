import { PaymentReceiptPanel } from "@/components/payments/payment-receipt-panel";
import { TenantShell } from "@/components/tenant/tenant-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return createPageMetadata({
    title: "Payment receipt",
    description: "Download your Ustawi rent payment receipt.",
    path: `/payments/receipts/${id}`,
    noIndex: true,
  });
}

export default async function PaymentReceiptPage({ params }: Props) {
  const { id } = await params;
  return (
    <TenantShell title="Receipt">
      <PaymentReceiptPanel receiptId={id} />
    </TenantShell>
  );
}
