import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "verified" | "safety" | "featured";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-ustawi-sand text-ustawi-navy",
        variant === "verified" && "bg-emerald-100 text-emerald-800",
        variant === "safety" && "bg-sky-100 text-sky-900",
        variant === "featured" && "bg-amber-100 text-amber-900",
        className,
      )}
    >
      {children}
    </span>
  );
}
