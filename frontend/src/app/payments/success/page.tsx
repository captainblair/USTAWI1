import { Suspense } from "react";
import { PaymentSuccessPanel } from "@/components/payments/payment-success-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Payment successful",
  description: "Your rent payment was successful.",
  path: "/payments/success",
  noIndex: true,
});

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPanel />
    </Suspense>
  );
}
