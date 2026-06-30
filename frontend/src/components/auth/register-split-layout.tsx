"use client";

/** Registration layout — re-exports premium auth shell + register-specific aliases */
export {
  PremiumAuthSplitLayout as RegisterSplitLayout,
  AuthProgressSteps as RegisterStepTrail,
  AuthRoleCard as RegisterRoleCard,
  AuthFieldLabel as RegisterFieldLabel,
  AuthFieldError as RegisterFieldError,
  authInputClass as registerInputClass,
  AuthGoogleButton as RegisterGoogleButton,
} from "@/components/auth/premium-auth-split-layout";

export { AUTH_HERO_IMAGE as REGISTER_HERO_IMAGE, HERO_IMAGE } from "@/lib/assets/sample-properties";
