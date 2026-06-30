"use client";

import Link from "next/link";
import { UstawiLogo } from "@/components/brand/ustawi-logo";

type AuthShellProps = {
  children: React.ReactNode;
  /** Navy hero headline (e.g. USTAWI on login). */
  heroTitle?: string;
  /** Optional content below hero title (role toggle, etc.). */
  heroExtra?: React.ReactNode;
};

export function AuthShell({ children, heroTitle, heroExtra }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#eef0f8] via-ustawi-cream to-[#fdeae8]/30">
      <div
        className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-ustawi-navy/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-ustawi-red/10 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 border-b border-ustawi-border/60 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center px-4 sm:px-6">
          <UstawiLogo variant="nav" />
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-ustawi-muted transition hover:text-ustawi-navy"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {(heroTitle || heroExtra) && (
          <div className="relative mb-[-2.5rem] overflow-hidden rounded-3xl bg-gradient-to-br from-ustawi-navy via-[#1a2560] to-[#0a1128] px-6 pb-16 pt-10 text-center shadow-[0_20px_60px_rgba(31,43,108,0.25)] sm:mb-[-3rem] sm:px-10 sm:pb-20 sm:pt-12">
            <div
              className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-ustawi-red/20 blur-2xl"
              aria-hidden
            />
            {heroTitle && (
              <h1 className="relative text-3xl font-bold tracking-[0.35em] text-white sm:text-4xl">
                {heroTitle}
              </h1>
            )}
            {heroExtra && <div className="relative mt-6">{heroExtra}</div>}
          </div>
        )}

        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}

export function AuthCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ustawi-border/50 bg-white shadow-[0_20px_60px_rgba(31,43,108,0.08)]">
      <div className="h-1 bg-gradient-to-r from-ustawi-red via-ustawi-red/80 to-ustawi-navy" />
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {title && (
          <h2 className="mb-6 text-center text-lg font-semibold text-ustawi-navy sm:text-xl">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}

export function AuthRoleToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            value === opt.value
              ? "bg-white text-ustawi-navy shadow-sm"
              : "text-white/85 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RegistrationProgress({ step, total = 3 }: { step: number; total?: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ustawi-muted">
        <span>
          Step {step} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ustawi-border/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ustawi-red to-ustawi-navy transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
