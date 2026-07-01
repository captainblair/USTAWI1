"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { downloadPaymentReceipt } from "@/lib/api/payments";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

type DownloadReceiptButtonProps = {
  receiptId: string;
  receiptNumber?: string | null;
  variant?: "button" | "link" | "outline";
  className?: string;
  label?: string;
  fullWidth?: boolean;
};

export function DownloadReceiptButton({
  receiptId,
  receiptNumber,
  variant = "button",
  className,
  label = "Download receipt (PDF)",
  fullWidth = false,
}: DownloadReceiptButtonProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      await downloadPaymentReceipt(
        accessToken,
        receiptId,
        receiptNumber ? `${receiptNumber}.pdf` : undefined,
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Download failed.");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "outline") {
    return (
      <div className={cn(fullWidth ? "w-full" : "inline-flex flex-col", className)}>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          className={cn(
            "h-11 rounded-full border-2 border-[#1F2B6C] bg-white px-6 text-sm font-semibold text-[#1F2B6C] hover:bg-[#FAFBFE]",
            fullWidth && "w-full",
          )}
          onClick={handleDownload}
        >
          {loading ? "Downloading…" : label}
        </Button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (variant === "link") {
    return (
      <span className={className}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="font-semibold text-ustawi-red hover:underline disabled:opacity-60"
        >
          {loading ? "Downloading…" : "Download"}
        </button>
        {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        disabled={loading}
        className="w-full rounded-xl bg-ustawi-navy"
        onClick={handleDownload}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing PDF…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download receipt (PDF)
          </>
        )}
      </Button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
