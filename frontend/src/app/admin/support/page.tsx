import { AdminSupportInboxPanel } from "@/components/admin/admin-support-inbox-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Support cases",
  description: "Admin support case management inbox.",
  path: "/admin/support",
  noIndex: true,
});

export default function AdminSupportPage() {
  return (
    <AdminShell title="Support cases">
      <AdminSupportInboxPanel />
    </AdminShell>
  );
}
