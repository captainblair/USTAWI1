"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  success = false,
  error = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (!disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [disabled]);

  function updateAt(index: number, char: string) {
    const next = digits
      .map((d, i) => (i === index ? char : d === " " ? "" : d))
      .join("")
      .slice(0, length);
    onChange(next.replace(/\s/g, ""));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    updateAt(index, char);
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-emerald-700">Verified — welcome to Ustawi!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[280px] grid-cols-6 gap-1.5 sm:max-w-xs sm:gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "aspect-square h-11 w-full min-w-0 rounded-xl border-2 bg-[#faf8f5] text-center text-lg font-bold text-ustawi-navy outline-none transition-colors duration-200 sm:h-14 sm:text-xl",
            "focus:border-ustawi-red focus:bg-white focus:ring-2 focus:ring-ustawi-red/15",
            error && "border-red-300 bg-red-50/50 animate-shake",
            digits[i]?.trim() && !error && "border-ustawi-navy/30 bg-white",
            disabled && "opacity-50",
          )}
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

export function OtpResendTimer({
  secondsLeft,
  onResend,
  loading,
}: {
  secondsLeft: number;
  onResend: () => void;
  loading?: boolean;
}) {
  if (secondsLeft > 0) {
    return (
      <p className="text-center text-sm text-ustawi-muted">
        Resend code in{" "}
        <span className="font-semibold tabular-nums text-ustawi-navy">{secondsLeft}s</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={loading}
      className="mx-auto block text-sm font-semibold text-ustawi-red transition hover:text-ustawi-red-hover disabled:opacity-50"
    >
      {loading ? "Sending…" : "Resend code"}
    </button>
  );
}
