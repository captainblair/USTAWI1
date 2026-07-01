import { InspectorCaseDetailPanel } from "@/components/inspector/inspector-case-detail-panel";
import { InspectorShell } from "@/components/inspector/inspector-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return createPageMetadata({
    title: "Verification case",
    description: "Review property verification case.",
    path: `/inspector/${id}`,
    noIndex: true,
  });
}

export default async function InspectorCasePage({ params }: Props) {
  const { id } = await params;
  return (
    <InspectorShell title="Case review">
      <InspectorCaseDetailPanel caseId={id} />
    </InspectorShell>
  );
}
