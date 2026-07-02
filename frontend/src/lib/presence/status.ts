export function formatLastSeen(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function landlordPresenceLabel(owner: {
  is_online?: boolean;
  last_seen_at?: string | null;
}): { label: string; online: boolean } {
  if (owner.is_online) {
    return { label: "Online", online: true };
  }

  const lastSeen = formatLastSeen(owner.last_seen_at);
  if (lastSeen) {
    return { label: `Last active ${lastSeen}`, online: false };
  }

  return { label: "Offline", online: false };
}
