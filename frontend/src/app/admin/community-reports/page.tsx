import { AdminShell } from "@/components/admin/admin-shell";
import { CommunityReportsPanel } from "@/components/verification/community-reports-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Community reports",
  description: "Review community-submitted property reports.",
  path: "/admin/community-reports",
  noIndex: true,
});

export default function AdminCommunityReportsPage() {
  return (
    <AdminShell title="Community reports">
      <CommunityReportsPanel basePath="/admin/community-reports" />
    </AdminShell>
  );
}
