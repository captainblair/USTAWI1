import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Users",
  description: "Manage platform users and roles.",
  path: "/admin/users",
  noIndex: true,
});

export default function AdminUsersPage() {
  return (
    <AdminShell title="Users">
      <AdminUsersPanel />
    </AdminShell>
  );
}
