import { AdminSupportDetailPanel } from "@/components/admin/admin-support-detail-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return createPageMetadata({
    title: "Support case",
    description: "Admin support case detail.",
    path: `/admin/support/${id}`,
    noIndex: true,
  });
}

export default async function AdminSupportDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminShell title="Case detail">
      <AdminSupportDetailPanel caseId={id} />
    </AdminShell>
  );
}
