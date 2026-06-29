import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LOGO_PATH } from "@/lib/assets/sample-properties";

type UstawiLogoProps = {
  className?: string;
  /** nav = header size, compact = mobile, full = auth/marketing */
  variant?: "nav" | "compact" | "full";
  priority?: boolean;
  /** Light logo for dark/glass backgrounds */
  inverted?: boolean;
};

const SIZES = { nav: 38, compact: 32, full: 52 } as const;

/** Horizontal Ustawi wordmark — logov.png */
export function UstawiLogo({
  className,
  variant = "nav",
  priority = false,
  inverted = false,
}: UstawiLogoProps) {
  const height = SIZES[variant];
  const width = Math.round(height * 3.35);

  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={LOGO_PATH}
        alt="Ustawi"
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-auto w-auto object-contain transition",
          inverted && "brightness-0 invert",
        )}
        style={{ maxHeight: height, width: "auto" }}
      />
    </Link>
  );
}
