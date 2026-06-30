import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Log in",
  description: "Sign in to your Ustawi tenant or landlord account to save properties and apply for homes.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ustawi-cream" />}>
      <LoginForm />
    </Suspense>
  );
}
