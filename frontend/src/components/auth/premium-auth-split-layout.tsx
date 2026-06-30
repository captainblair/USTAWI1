"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Home, ShieldCheck } from "lucide-react";
import { UstawiLogoMark } from "@/components/brand/ustawi-logo";
import { HERO_IMAGE } from "@/lib/assets/sample-properties";
import { cn } from "@/lib/utils";

export type AuthBrandVariant = "login" | "register" | "verify";

const BRAND_COPY: Record<
  AuthBrandVariant,
  { description: string; footer: string; pills: { icon: typeof Home; label: string }[] }
> = {
  login: {
    description:
      "Sign in to save properties, track applications, and manage your account with verified listings and secure M-Pesa payments.",
    footer: "Trusted housing across Kenya",
    pills: [
      { icon: Home, label: "Saved properties" },
      { icon: ShieldCheck, label: "Verified listings" },
      { icon: CreditCard, label: "M-Pesa ready" },
    ],
  },
  register: {
    description:
      "Join Ustawi to discover verified homes, neighbourhood safety scores, and secure rent payments — built for tenants, landlords, and agents.",
    footer: "Verified homes · Safe neighbourhoods · Kenya-first",
    pills: [
      { icon: Home, label: "Find your home" },
      { icon: ShieldCheck, label: "Safety scores" },
      { icon: CreditCard, label: "Secure payments" },
    ],
  },
  verify: {
    description:
      "Confirm your phone number to activate your account and start browsing verified listings across Kenya.",
    footer: "Trusted housing across Kenya",
    pills: [
      { icon: ShieldCheck, label: "Secure verification" },
      { icon: Home, label: "Verified listings" },
      { icon: CreditCard, label: "M-Pesa ready" },
    ],
  },
};

type PremiumAuthSplitLayoutProps = {
  children: React.ReactNode;
  brandVariant?: AuthBrandVariant;
  heroImage?: string;
  maxFormWidth?: "md" | "lg";
};

function AuthBrandPanel({
  variant,
  heroImage,
  className,
}: {
  variant: AuthBrandVariant;
  heroImage: string;
  className?: string;
}) {
  const copy = BRAND_COPY[variant];

  return (
    <div className={cn("relative flex flex-col overflow-hidden", className)}>
      <Image src={heroImage} alt="" fill className="object-cover object-center" priority sizes="50vw" />
      <div className="absolute inset-0 bg-ustawi-navy/78" />

      <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="my-8 max-w-md">
          <div className="mb-6 inline-flex rounded-lg bg-white px-3 py-2 shadow-lg">
            <UstawiLogoMark variant="compact" priority />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white xl:text-[2rem]">Ustawi</h2>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ustawi-red">
            Verified homes · Kenya
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/85">{copy.description}</p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {copy.pills.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm">
                  <Icon className="h-4 w-4 shrink-0 text-ustawi-red" strokeWidth={1.75} />
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">{copy.footer}</p>
      </div>
    </div>
  );
}

export function PremiumAuthSplitLayout({
  children,
  brandVariant = "register",
  heroImage = HERO_IMAGE,
  maxFormWidth = "lg",
}: PremiumAuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Desktop brand panel — borrow.png / borrow1.png pattern */}
      <aside className="relative order-1 hidden min-h-screen lg:order-none lg:block lg:w-1/2">
        <AuthBrandPanel variant={brandVariant} heroImage={heroImage} className="min-h-screen" />
      </aside>

      {/* Form panel — clean white */}
      <div className="relative order-2 flex w-full flex-col bg-white lg:w-1/2">
        {/* Mobile brand strip */}
        <div className="relative h-44 shrink-0 lg:hidden">
          <Image src={heroImage} alt="" fill className="object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-ustawi-navy/80" />
          <div className="relative z-10 flex h-full flex-col justify-between p-5">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Link>
            <div>
              <div className="mb-2 inline-flex rounded-md bg-white px-2 py-1">
                <UstawiLogoMark variant="compact" />
              </div>
              <p className="text-lg font-bold text-white">Ustawi</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ustawi-red">
                Verified homes · Kenya
              </p>
            </div>
          </div>
        </div>

        <main
          className={cn(
            "mx-auto flex w-full flex-1 flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12",
            maxFormWidth === "md" && "max-w-[420px]",
            maxFormWidth === "lg" && "max-w-[460px]",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthProgressSteps({ current }: { current: 1 | 2 }) {
  const steps = [
    { num: 1, label: "Create account" },
    { num: 2, label: "Verify phone" },
  ] as const;

  return (
    <nav aria-label="Registration progress" className="mb-7">
      <ol className="flex items-center">
        {steps.map((step, i) => {
          const done = current > step.num;
          const active = current === step.num;
          return (
            <li key={step.num} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    active && "bg-ustawi-red text-white",
                    done && "bg-ustawi-navy text-white",
                    !active && !done && "bg-[#F4F6F8] text-ustawi-muted",
                  )}
                >
                  {done ? "✓" : step.num}
                </span>
                <span className={cn("text-[13px] font-medium", active ? "text-ustawi-navy" : "text-ustawi-muted")}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className="mx-4 h-px flex-1 bg-[#E8EAF2]" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AuthPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-ustawi-navy">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-ustawi-muted">{subtitle}</p>}
    </header>
  );
}

export function AuthFieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
      {children}
    </label>
  );
}

export function AuthFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

/** Borrow-style inputs — soft fill on white panel */
export const authInputClass =
  "h-11 rounded-lg border border-transparent bg-[#F4F6F8] text-sm text-ustawi-navy placeholder:text-ustawi-muted/60 transition focus:border-ustawi-navy/20 focus:bg-white focus:ring-2 focus:ring-ustawi-navy/10";

export function AuthPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-lg bg-ustawi-red text-sm font-semibold text-white transition hover:bg-ustawi-red-hover disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthGoogleButton() {
  return (
    <button
      type="button"
      disabled
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#E8EAF2] bg-white text-sm font-medium text-ustawi-navy transition hover:bg-[#FAFBFC] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Google
      <span className="font-normal text-ustawi-muted">(soon)</span>
    </button>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#E8EAF2]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium text-ustawi-muted">{label}</span>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  linkText,
  href,
}: {
  prompt: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="mt-8 text-center text-sm text-ustawi-muted">
      {prompt}{" "}
      <Link href={href} className="font-semibold text-ustawi-red hover:underline">
        {linkText}
      </Link>
    </p>
  );
}

export function AuthRoleCard({
  selected,
  label,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg border px-2 py-3 text-center transition-colors",
        selected
          ? "border-ustawi-red bg-[#FFF5F4] ring-1 ring-ustawi-red/20"
          : "border-[#E8EAF2] bg-[#F4F6F8] hover:border-ustawi-navy/15",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          selected ? "bg-white text-ustawi-red" : "bg-white text-ustawi-navy",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="mt-2 text-[13px] font-semibold text-ustawi-navy">{label}</span>
      <span className="mt-0.5 text-[10px] leading-snug text-ustawi-muted">{description}</span>
    </button>
  );
}
