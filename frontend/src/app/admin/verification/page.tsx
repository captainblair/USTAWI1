import { AdminVerificationPanel } from "@/components/admin/admin-verification-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Verification pipeline",
  description: "Admin verification pipeline overview and stats.",
  path: "/admin/verification",
  noIndex: true,
});

export default function AdminVerificationPage() {
  return (
    <AdminShell title="Verification pipeline">
      <AdminVerificationPanel />
    </AdminShell>
  );
}
