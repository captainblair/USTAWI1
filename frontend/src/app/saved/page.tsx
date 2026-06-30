import { SavedPropertiesPanel } from "@/components/properties/saved-properties-panel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Saved Properties",
  description:
    "View and manage homes you have saved on Ustawi. Available for authenticated tenant accounts.",
  path: "/saved",
  noIndex: true,
});

export default function SavedPropertiesPage() {
  return (
    <div className="bg-ustawi-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">Your list</p>
          <h1 className="mt-2 text-3xl font-bold text-ustawi-navy sm:text-4xl">Saved properties</h1>
          <p className="mt-2 max-w-2xl text-ustawi-muted">
            Bookmark verified listings while you search — compare safety scores, prices, and
            neighborhoods in one place.
          </p>
        </div>
        <SavedPropertiesPanel />
      </div>
    </div>
  );
}
