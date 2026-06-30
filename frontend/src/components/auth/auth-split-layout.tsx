"use client";

/** @deprecated Use premium-auth-split-layout — kept for backward compatibility */
export {
  PremiumAuthSplitLayout as AuthSplitLayout,
  AuthProgressSteps as AuthStepIndicator,
  AuthFieldLabel,
  AuthFieldError,
  AuthGoogleButton,
  AuthDivider,
  authInputClass,
} from "@/components/auth/premium-auth-split-layout";

export function AuthFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
