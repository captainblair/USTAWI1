import { cn } from "@/lib/utils";

export function PayPalMark({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded bg-[#0070BA] font-extrabold italic text-white",
        size === "sm" ? "h-5 w-5 text-[9px]" : "h-11 w-11 text-sm",
        className,
      )}
      aria-hidden
    >
      P
    </span>
  );
}
