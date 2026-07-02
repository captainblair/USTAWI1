import { resolvePropertyImageUrl } from "@/lib/media-url";
import type { LeaseDetail } from "@/types/lease";

export type LeaseDocTab = {
  id: string;
  label: string;
  fileUrl: string | null;
  signed: boolean;
};

export function buildLeaseDocTabs(lease: LeaseDetail): LeaseDocTab[] {
  const tabs: LeaseDocTab[] = [];

  const agreement = lease.documents.find((d) => d.doc_type === "LEASE_AGREEMENT");
  if (agreement) {
    tabs.push({
      id: agreement.id,
      label: "Lease Agreement",
      fileUrl: agreement.file_url,
      signed: lease.signature_status.tenant_signed && lease.signature_status.landlord_signed,
    });
  }

  lease.addendums.forEach((addendum, index) => {
    if (!addendum.document?.id) return;
    tabs.push({
      id: addendum.document.id,
      label: addendum.title || `Addendum ${String.fromCharCode(65 + index)}`,
      fileUrl: addendum.document.file_url ?? null,
      signed: Boolean(lease.signed_pdf_url),
    });
  });

  lease.documents
    .filter((d) => d.doc_type === "SERVICE_CONTRACT")
    .forEach((doc) => {
      tabs.push({
        id: doc.id,
        label: doc.title || "Service Contract",
        fileUrl: doc.file_url,
        signed: Boolean(lease.signed_pdf_url),
      });
    });

  if (lease.signed_pdf_url) {
    const signedCopy = lease.documents.find((d) => d.doc_type === "SIGNED_COPY");
    tabs.push({
      id: signedCopy?.id ?? "signed-pdf",
      label: "Signed copy",
      fileUrl: lease.signed_pdf_url,
      signed: true,
    });
  }

  return tabs;
}

/** @deprecated Use authenticated lease download endpoints instead. */
export function resolveLeaseDocUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resolvePropertyImageUrl(url);
}
