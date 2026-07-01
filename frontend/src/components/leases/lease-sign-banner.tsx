"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaseSignBannerProps = {
  title: string;
  description: string;
  checkboxLabel: string;
  buttonLabel: string;
  acceptedTerms: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onSign: () => void;
  signing: boolean;
  hint?: string;
  className?: string;
};

export function LeaseSignBanner({
  title,
  description,
  checkboxLabel,
  buttonLabel,
  acceptedTerms,
  onAcceptedChange,
  onSign,
  signing,
  hint,
  className,
}: LeaseSignBannerProps) {
  return (
    <div className={cn("rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5", className)}>
      <h2 className="text-base font-bold text-amber-950 sm:text-lg">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{description}</p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-300 text-ustawi-navy focus:ring-ustawi-navy/20"
        />
        <span className="text-sm leading-snug text-amber-950">{checkboxLabel}</span>
      </label>
      <Button
        type="button"
        className="mt-4 w-full rounded-xl bg-ustawi-navy hover:bg-ustawi-navy/90 sm:w-auto"
        disabled={!acceptedTerms || signing}
        onClick={onSign}
      >
        {signing ? "Signing…" : buttonLabel}
      </Button>
      {hint && <p className="mt-2 text-xs text-amber-800">{hint}</p>}
    </div>
  );
}
