import { ProfilePanel } from "@/components/profile/profile-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Your profile",
  description: "View and update your Ustawi account profile, contact details, and verification status.",
  path: "/profile",
  noIndex: true,
});

export default function ProfilePage() {
  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Your profile</h1>
          <p className="mt-2 text-ustawi-muted">Manage your personal details and see your verification status.</p>
        </div>
        <ProfilePanel />
      </div>
    </div>
  );
}
