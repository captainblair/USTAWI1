import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LOGO_PATH } from "@/lib/assets/sample-properties";

type UstawiLogoProps = {
  className?: string;
  variant?: "nav" | "compact" | "full";
  priority?: boolean;
  /** onDark = over hero glass nav; onLight = white header */
  tone?: "onLight" | "onDark";
};

const HEIGHTS = { nav: 48, compact: 40, full: 72 } as const;

export function UstawiLogoMark({
  variant = "nav",
  priority = false,
  className,
}: Pick<UstawiLogoProps, "variant" | "priority" | "className">) {
  const height = HEIGHTS[variant];

  return (
    <Image
      src={LOGO_PATH}
      alt="Ustawi"
      width={Math.round(height * 3.2)}
      height={height}
      priority={priority}
      className={cn("block w-auto object-contain object-left", className)}
      style={{ height, maxHeight: height }}
    />
  );
}

export function UstawiLogo({
  className,
  variant = "nav",
  priority = false,
  tone = "onLight",
}: UstawiLogoProps) {
  const mark = <UstawiLogoMark variant={variant} priority={priority} />;

  return (
    <Link
      href="/"
      aria-label="Ustawi home"
      className={cn(
        "inline-flex shrink-0 items-center transition-opacity hover:opacity-90",
        tone === "onDark" && "rounded-md bg-white/90 px-2.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
        className,
      )}
    >
      {mark}
    </Link>
  );
}
