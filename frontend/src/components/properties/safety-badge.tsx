import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function SafetyBadge({
  score,
  isVerified,
  size = "md",
  className,
}: {
  score: number | string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const value = typeof score === "string" ? parseFloat(score) : score;
  const hasScore = Number.isFinite(value) && value > 0;

  if (!hasScore) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-white/95 font-semibold text-ustawi-muted shadow-sm backdrop-blur",
          size === "sm" && "px-2 py-0.5 text-xs",
          size === "md" && "px-2.5 py-1 text-xs",
          size === "lg" && "px-3 py-1.5 text-sm",
          className,
        )}
      >
        <ShieldCheck className={cn("text-ustawi-muted", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")} />
        <span>{isVerified ? "Score pending" : "Not scored"}</span>
      </div>
    );
  }

  const label = value >= 8 ? "Excellent" : value >= 6 ? "Good" : "Fair";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/95 font-semibold text-ustawi-navy shadow-sm backdrop-blur",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <ShieldCheck className={cn("text-ustawi-success", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")} />
      <span>{value.toFixed(1)}</span>
      <span className="font-normal text-ustawi-muted">· {label}</span>
    </div>
  );
}
