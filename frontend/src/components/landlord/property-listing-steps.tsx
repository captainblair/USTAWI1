import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Details" },
  { n: 2, label: "Photos" },
  { n: 3, label: "Publish" },
] as const;

export function PropertyListingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-2 sm:gap-0 sm:divide-x sm:divide-[#E8EAF2] sm:rounded-xl sm:border sm:border-[#E8EAF2] sm:bg-white">
      {STEPS.map(({ n, label }) => {
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={n}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm sm:rounded-none sm:px-4 sm:py-3",
              active && "bg-ustawi-navy/5 font-semibold text-ustawi-navy sm:bg-ustawi-cream",
              done && !active && "text-emerald-700",
              !active && !done && "text-ustawi-muted",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                active && "bg-ustawi-navy text-white",
                done && !active && "bg-emerald-100 text-emerald-800",
                !active && !done && "bg-[#E8EAF2] text-ustawi-muted",
              )}
            >
              {done && !active ? "✓" : n}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
