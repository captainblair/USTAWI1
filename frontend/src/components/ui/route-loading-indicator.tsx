import { Loader2 } from "lucide-react";

export function RouteLoadingIndicator({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy/40" />
      <p className="mt-3 text-sm text-ustawi-muted">{label}</p>
    </div>
  );
}
