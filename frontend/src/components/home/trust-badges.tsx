import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function MpesaBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-[#4CAF50]/30 bg-[#4CAF50]/10 px-4 py-2.5",
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4CAF50] text-xs font-extrabold text-white">
        M
      </span>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2E7D32]">Payments via</p>
        <p className="text-sm font-bold text-[#1B5E20]">M-Pesa</p>
      </div>
    </div>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-ustawi-navy/10 bg-white px-4 py-2.5 shadow-sm",
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ustawi-navy">
        <ShieldCheck className="h-4 w-4 text-white" />
      </span>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ustawi-muted">Trust badge</p>
        <p className="text-sm font-bold text-ustawi-navy">Verified by Ustawi</p>
      </div>
    </div>
  );
}

export function TrustBadgesRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      <VerifiedBadge />
      <MpesaBadge />
    </div>
  );
}
