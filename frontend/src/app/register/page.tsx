import { RegisterWizard } from "@/components/auth/register-wizard";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getGoogleClientId } from "@/lib/env/google";

export const metadata = createPageMetadata({
  title: "Register",
  description: "Create a Ustawi account to search verified rentals, save properties, and apply securely.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  const googleClientId = getGoogleClientId();

  return <RegisterWizard googleClientId={googleClientId} />;
}
