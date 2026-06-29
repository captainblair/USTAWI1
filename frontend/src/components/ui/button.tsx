import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ustawi-red/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-ustawi-gradient text-white shadow-ustawi-red",
          variant === "secondary" && "bg-ustawi-navy text-white hover:bg-ustawi-navy-light",
          variant === "outline" &&
            "border border-ustawi-border bg-white text-ustawi-navy hover:bg-ustawi-sand/50",
          variant === "ghost" && "text-ustawi-navy hover:bg-ustawi-sand/60",
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-5 py-2.5 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
