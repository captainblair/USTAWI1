import { API_BASE } from "@/lib/api/client";
import { ApiRequestError } from "@/types/api";

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
    throw new ApiRequestError("The server did not return a valid PDF receipt.", response.status);
  }
  return blob;
}

/** Fetch receipt PDF with auth and trigger a browser file download. */
export async function downloadPaymentReceiptFile(token: string, receiptId: string, fallbackName?: string) {
  const response = await fetch(`${API_BASE}/payments/receipts/${receiptId}/download/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf, application/octet-stream;q=0.9, */*;q=0.8",
    },
  });

  if (!response.ok) {
    let message = "Could not download receipt.";
    try {
      const payload = await response.json();
      message = payload?.error?.message ?? message;
    } catch {
      if (response.status === 404) {
        message = "Receipt not found.";
      }
    }
    throw new ApiRequestError(message, response.status);
  }

  const blob = await readPdfBlob(response);
  const filename = parseFilename(
    response.headers.get("Content-Disposition"),
    fallbackName ?? `ustawi-receipt-${receiptId}.pdf`,
  );

  const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
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
