import { InspectorQueuePanel } from "@/components/inspector/inspector-queue-panel";
import { InspectorShell } from "@/components/inspector/inspector-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Inspector queue",
  description: "Property verification queue for Ustawi inspectors.",
  path: "/inspector",
  noIndex: true,
});

export default function InspectorQueuePage() {
  return (
    <InspectorShell title="Verification queue">
      <InspectorQueuePanel />
    </InspectorShell>
  );
}
