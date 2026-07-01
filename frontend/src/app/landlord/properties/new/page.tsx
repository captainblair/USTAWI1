import { LandlordPropertyFormPanel } from "@/components/landlord/landlord-property-form-panel";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Add property",
  description: "Create a new property listing on Ustawi.",
  path: "/landlord/properties/new",
  noIndex: true,
});

export default function LandlordNewPropertyPage() {
  return (
    <LandlordShell title="Add property">
      <LandlordPropertyFormPanel mode="create" />
    </LandlordShell>
  );
}
