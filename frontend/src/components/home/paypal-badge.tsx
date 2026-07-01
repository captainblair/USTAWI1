import { cn } from "@/lib/utils";
import { PayPalMark } from "@/components/payments/paypal-mark";

export function PayPalBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-[#0070BA]/30 bg-[#0070BA]/10 px-4 py-2.5",
        className,
      )}
    >
      <PayPalMark size="md" className="rounded-xl" />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003087]">Payments via</p>
        <p className="text-sm font-bold text-[#0070BA]">PayPal</p>
      </div>
    </div>
  );
}
