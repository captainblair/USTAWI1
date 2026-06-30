"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreeningScoreBadge } from "@/components/applications/application-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchApplicationDetail } from "@/lib/api/applications";
import { isTenant } from "@/lib/auth/constants";
import type { ApplicationDetail } from "@/types/application";
import { ApiRequestError } from "@/types/api";

export function ApplicationSuccessPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=/applications/${applicationId}/success`);
      return;
    }

    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchApplicationDetail(accessToken!, applicationId);
        if (!cancelled) setApplication(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load application.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, applicationId, authLoading, isAuthenticated, router, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Application not found."}
      </div>
    );
  }

  const nextSteps = [
    "Landlord reviews your profile and documents.",
    "We'll notify you of any status updates.",
    "Expect a response within 2–3 business days.",
  ];

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h2 className="mt-6 text-3xl font-bold text-ustawi-navy">Application submitted!</h2>
      <p className="mt-3 text-ustawi-muted">
        Your application for <strong className="text-ustawi-navy">{application.summary.property_title}</strong>{" "}
        is on its way to the landlord.
      </p>

      {application.verification.screening_score > 0 && (
        <div className="mt-6 flex justify-center">
          <ScreeningScoreBadge
            score={application.verification.screening_score}
            label={application.verification.screening_label}
          />
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-ustawi-border bg-white p-6 text-left shadow-sm">
        <h3 className="text-sm font-bold text-ustawi-navy">What happens next</h3>
        <ol className="mt-4 space-y-3">
          {nextSteps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-ustawi-muted">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ustawi-navy text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/applications/${application.id}`}>
          <Button>View application</Button>
        </Link>
        <Link href="/applications">
          <Button variant="outline">My applications</Button>
        </Link>
        <Link href="/properties">
          <Button variant="ghost">Browse more homes</Button>
        </Link>
      </div>
    </div>
  );
}
