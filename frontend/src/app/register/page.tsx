import { RegisterWizard } from "@/components/auth/register-wizard";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Register",
  description: "Create a Ustawi account to search verified rentals, save properties, and apply securely.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return <RegisterWizard />;
}
