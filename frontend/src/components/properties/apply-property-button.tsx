"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { isTenant } from "@/lib/auth/constants";

export function ApplyPropertyButton({
  propertyId,
  propertySlug,
  className,
}: {
  propertyId: string;
  propertySlug: string;
  className?: string;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button size="lg" className={className} disabled>
        Apply now
      </Button>
    );
  }

  const applyHref = `/properties/${propertySlug}/apply?property=${propertyId}`;

  if (!isAuthenticated) {
    return (
      <Link href={`/login?next=${encodeURIComponent(applyHref)}`} className="block">
        <Button size="lg" className={className}>
          Apply now
        </Button>
      </Link>
    );
  }

  if (!isTenant(user)) {
    return (
      <Button size="lg" className={className} disabled title="Only tenant accounts can apply">
        Apply now
      </Button>
    );
  }

  return (
    <Link href={applyHref} className="block">
      <Button size="lg" className={className}>
        Apply now
      </Button>
    </Link>
  );
}
