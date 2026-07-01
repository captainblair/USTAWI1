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

/** Fetch receipt PDF with auth and trigger a browser file download. */
export async function downloadPaymentReceiptFile(token: string, receiptId: string, fallbackName?: string) {
  const response = await fetch(`${API_BASE}/payments/receipts/${receiptId}/download/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let message = "Could not download receipt.";
    try {
      const payload = await response.json();
      message = payload?.error?.message ?? message;
    } catch {
      // non-JSON error body
    }
    throw new ApiRequestError(message, response.status);
  }

  const blob = await response.blob();
  const filename = parseFilename(
    response.headers.get("Content-Disposition"),
    fallbackName ?? `ustawi-receipt-${receiptId}.pdf`,
  );

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
