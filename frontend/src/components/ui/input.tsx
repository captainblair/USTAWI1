import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-ustawi-border bg-white px-4 text-sm text-ustawi-navy placeholder:text-ustawi-muted focus:border-ustawi-navy focus:outline-none focus:ring-2 focus:ring-ustawi-navy/10",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-lg border border-ustawi-border bg-white px-4 text-sm text-ustawi-navy focus:border-ustawi-navy focus:outline-none focus:ring-2 focus:ring-ustawi-navy/10",
      className,
    )}
    {...props}
  />
));

Select.displayName = "Select";
