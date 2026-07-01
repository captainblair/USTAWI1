import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "User details",
    description: "View and manage a platform user.",
    path: `/admin/users/${id}`,
    noIndex: true,
  });
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdminShell title="User details">
      <AdminUserDetailPanel userId={id} />
    </AdminShell>
  );
}
