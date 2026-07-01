import { LandlordAddPropertyButton, LandlordShell } from "@/components/landlord/landlord-shell";
import { LandlordPropertiesPanel } from "@/components/landlord/landlord-properties-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "My properties",
  description: "Manage your property listings on Ustawi.",
  path: "/landlord/properties",
  noIndex: true,
});

export default function LandlordPropertiesPage() {
  return (
    <LandlordShell title="Properties" action={<LandlordAddPropertyButton />}>
      <LandlordPropertiesPanel />
    </LandlordShell>
  );
}
