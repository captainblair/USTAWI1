import Image from "next/image";
import { cn } from "@/lib/utils";

const ICON_SRC = "/images/search/house-search-icon.png";

type HouseSearchIconProps = {
  className?: string;
  /** hero = main empty state; card = recommended neighborhood thumbnail */
  variant?: "hero" | "card";
};

/**
 * House + magnifying glass illustration from the search empty-state wireframe.
 * Same asset used in the hero empty state and Recommended Neighborhoods cards.
 */
export function HouseSearchIcon({ className, variant = "hero" }: HouseSearchIconProps) {
  if (variant === "hero") {
    return (
      <Image
        src={ICON_SRC}
        alt=""
        width={220}
        height={220}
        className={cn("h-auto w-[min(100%,220px)] max-w-none object-contain sm:w-[240px]", className)}
        priority
      />
    );
  }

  return (
    <Image
      src={ICON_SRC}
      alt=""
      width={80}
      height={80}
      className={cn("h-auto max-h-full w-auto max-w-full object-contain", className)}
    />
  );
}

/** @deprecated use HouseSearchIcon */
export function SearchEmptyIllustration(props: HouseSearchIconProps) {
  return <HouseSearchIcon {...props} />;
}
