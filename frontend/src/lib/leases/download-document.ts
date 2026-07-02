import { API_BASE } from "@/lib/api/client";
import { ApiRequestError } from "@/types/api";

type LeaseDocDownloadOptions = {
  asLandlord?: boolean;
  signedPdf?: boolean;
};

export function leaseDocumentDownloadPath(
  leaseId: string,
  docId: string,
  { asLandlord = false, signedPdf = false }: LeaseDocDownloadOptions = {},
): string {
  const prefix = asLandlord ? `/landlord/leases/${leaseId}` : `/leases/${leaseId}`;
  if (signedPdf || docId === "signed-pdf") {
    return `${prefix}/signed-pdf/download/`;
  }
  return `${prefix}/documents/${docId}/download/`;
}

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename\*?=(?:UTF-8''|"?)([^";\n]+)/i.exec(contentDisposition);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1].replace(/"/g, ""));
    } catch {
      return match[1].replace(/"/g, "");
    }
  }
  return fallback;
}

async function readPdfBlob(response: Response): Promise<Blob> {
  const blob = await response.blob();
  const header = await blob.slice(0, 5).text();
  if (!header.startsWith("%PDF")) {
    throw new ApiRequestError("The server did not return a valid PDF document.", response.status);
  }
  return blob;
}

/** Fetch a lease PDF with auth (preview, download, or new-tab open). */
export async function fetchLeaseDocumentPdf(
  token: string,
  leaseId: string,
  docId: string,
  options: LeaseDocDownloadOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const path = leaseDocumentDownloadPath(leaseId, docId, options);
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf, application/octet-stream;q=0.9, */*;q=0.8",
    },
  });

  if (!response.ok) {
    let message = "Could not load lease document.";
    try {
      const payload = await response.json();
      message = payload?.error?.message ?? message;
    } catch {
      if (response.status === 404) {
        message = "Lease document not found. Refresh the page and try again.";
      }
    }
    throw new ApiRequestError(message, response.status);
  }

  const blob = await readPdfBlob(response);
  const filename = parseFilename(
    response.headers.get("Content-Disposition"),
    options.signedPdf || docId === "signed-pdf" ? `lease-${leaseId}-signed.pdf` : `lease-${docId}.pdf`,
  );

  return { blob, filename };
}

/** Trigger a browser file download for a lease PDF. */
export async function downloadLeaseDocumentPdf(
  token: string,
  leaseId: string,
  docId: string,
  options: LeaseDocDownloadOptions = {},
) {
  const { blob, filename } = await fetchLeaseDocumentPdf(token, leaseId, docId, options);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return filename;
}

/** Open lease PDF in a new tab using an authenticated fetch + blob URL. */
export async function openLeaseDocumentInNewTab(
  token: string,
  leaseId: string,
  docId: string,
  options: LeaseDocDownloadOptions = {},
) {
  const { blob } = await fetchLeaseDocumentPdf(token, leaseId, docId, options);
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (!tab) {
    URL.revokeObjectURL(url);
    throw new ApiRequestError("Pop-up blocked. Allow pop-ups to open the document.", 400);
  }
  tab.addEventListener("unload", () => URL.revokeObjectURL(url), { once: true });
}
