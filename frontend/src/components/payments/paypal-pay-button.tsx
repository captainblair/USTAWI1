"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PayPalMark } from "@/components/payments/paypal-mark";
import { cn } from "@/lib/utils";

type PayPalPayButtonProps = {
  className?: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
};

export function PayPalPayButton({ className, variant = "primary", disabled = false }: PayPalPayButtonProps) {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      <Button
        type="button"
        disabled={disabled}
        className={cn(
          "h-11 w-full rounded-xl text-base font-bold",
          variant === "primary"
            ? "bg-[#0070BA] hover:bg-[#0070BA]/90"
            : "border border-[#0070BA]/30 bg-white text-[#0070BA] hover:bg-[#0070BA]/5",
        )}
        onClick={() => setShowNotice(true)}
      >
        <PayPalMark className="mr-2" />
        Pay with PayPal
      </Button>
      {showNotice && (
        <p
          role="status"
          className="mt-2 rounded-lg border border-[#0070BA]/20 bg-[#0070BA]/5 px-3 py-2 text-center text-sm font-medium text-[#003087]"
        >
          Coming soon!
        </p>
      )}
    </div>
  );
}
