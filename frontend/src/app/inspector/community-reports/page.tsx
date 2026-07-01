import { InspectorShell } from "@/components/inspector/inspector-shell";
import { CommunityReportsPanel } from "@/components/verification/community-reports-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Community reports",
  description: "Review community-submitted property reports.",
  path: "/inspector/community-reports",
  noIndex: true,
});

export default function InspectorCommunityReportsPage() {
  return (
    <InspectorShell title="Community reports">
      <CommunityReportsPanel basePath="/inspector/community-reports" />
    </InspectorShell>
  );
}
