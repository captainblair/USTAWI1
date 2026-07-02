"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLeaseDocumentPdf } from "@/lib/leases/download-document";

type LeasePdfViewerProps = {
  leaseId: string;
  accessToken: string;
  docId: string;
  signedPdf?: boolean;
  asLandlord?: boolean;
  title: string;
  subtitle?: string;
};

/**
 * Loads lease PDF via authenticated API download, then embeds a blob URL.
 * Avoids 401s from unauthenticated /media/ or API metadata URLs in new tabs.
 */
export function LeasePdfViewer({
  leaseId,
  accessToken,
  docId,
  signedPdf = false,
  asLandlord = false,
  title,
  subtitle,
}: LeasePdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leaseId || !accessToken || !docId) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      try {
        const { blob } = await fetchLeaseDocumentPdf(accessToken, leaseId, docId, {
          asLandlord,
          signedPdf,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setError("Could not load preview. Use the link below to open the document.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, asLandlord, docId, leaseId, signedPdf]);

  if (!docId) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center p-4 sm:min-h-[280px] sm:p-6">
        <FileText className="h-16 w-16 text-[#1F2B6C]/20" strokeWidth={1.25} />
        <p className="mt-4 text-center font-semibold text-ustawi-navy">{title}</p>
        {subtitle && <p className="mt-1 text-center text-sm text-ustawi-muted">{subtitle}</p>}
        <p className="mt-3 text-center text-sm text-ustawi-muted">
          Document is being prepared. Refresh in a moment.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center p-4 sm:min-h-[280px] sm:p-6">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
        <p className="mt-3 text-sm text-ustawi-muted">Loading document…</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center p-4 sm:min-h-[280px] sm:p-6">
        <FileText className="h-16 w-16 text-[#1F2B6C]/20" strokeWidth={1.25} />
        <p className="mt-4 text-center font-semibold text-ustawi-navy">{title}</p>
        <p className="mt-2 text-center text-sm text-ustawi-muted">{error ?? "Preview unavailable."}</p>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      title={title}
      className="h-[min(52vh,420px)] w-full bg-white sm:h-[min(65vh,560px)] lg:h-[min(70vh,640px)]"
    />
  );
}
