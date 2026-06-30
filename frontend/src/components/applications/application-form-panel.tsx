"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Loader2, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createApplication,
  fetchMyApplications,
  submitApplication,
  updateApplication,
  uploadApplicationDocument,
} from "@/lib/api/applications";
import { fetchPropertyDetail } from "@/lib/api/properties";
import { isTenant } from "@/lib/auth/constants";
import { propertyImageSrc } from "@/lib/media-url";
import { formatPrice } from "@/lib/utils";
import {
  APPLICATION_DOCUMENT_TYPES,
  type ApplicationDetail,
  type ApplicationDocumentType,
} from "@/types/application";
import type { PropertyDetail } from "@/types/property";
import { ApiRequestError } from "@/types/api";
import { isActiveApplicationStatus } from "@/lib/applications/status";

const inputClass =
  "h-11 rounded-lg border-[#E8EAF2] bg-white text-sm text-ustawi-navy placeholder:text-ustawi-muted/60 focus:border-ustawi-navy/30 focus:ring-2 focus:ring-ustawi-navy/10";

type PendingUpload = {
  id: string;
  file: File;
  docType: ApplicationDocumentType;
  title: string;
};

export function ApplicationFormPanel({ propertySlug }: { propertySlug: string }) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [moveInDate, setMoveInDate] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [employmentTitle, setEmploymentTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadDocType, setUploadDocType] = useState<ApplicationDocumentType>("NATIONAL_ID");

  const loadContext = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const prop = await fetchPropertyDetail(propertySlug, accessToken);
      setProperty(prop);

      const apps = await fetchMyApplications(accessToken);
      const existing = apps.results.find(
        (app) => app.property.id === prop.id && isActiveApplicationStatus(app.status),
      );

      if (existing) {
        const { fetchApplicationDetail } = await import("@/lib/api/applications");
        const detail = await fetchApplicationDetail(accessToken, existing.id);
        setApplication(detail);
        setMoveInDate(detail.summary.move_in_date ?? "");
        setCoverLetter(detail.summary.cover_letter ?? "");
        setEmploymentTitle(detail.verification.employment_title ?? "");
        setEmployer(detail.verification.employer ?? "");
        setMonthlyIncome(detail.summary.monthly_income ?? "");
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load application.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, propertySlug]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(`/properties/${propertySlug}/apply`)}`);
      return;
    }
    if (!isTenant(user)) {
      router.replace("/profile");
      return;
    }
    loadContext();
  }, [accessToken, authLoading, isAuthenticated, loadContext, propertySlug, router, user]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingUploads((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file,
        docType: uploadDocType,
        title: file.name,
      },
    ]);
    e.target.value = "";
  }

  function removePending(id: string) {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id));
  }

  async function ensureDraft(): Promise<ApplicationDetail> {
    if (!accessToken || !property) throw new Error("Missing context");

    const payload = {
      move_in_date: moveInDate || undefined,
      cover_letter: coverLetter.trim(),
      employment_title: employmentTitle.trim(),
      employer: employer.trim(),
      monthly_income: monthlyIncome || undefined,
    };

    if (application) {
      if (application.status !== "DRAFT") return application;
      return updateApplication(accessToken, application.id, payload);
    }

    return createApplication(accessToken, {
      property_id: property.id,
      ...payload,
      submit: false,
    });
  }

  async function uploadPendingFiles(appId: string) {
    if (!accessToken) return;
    for (const item of pendingUploads) {
      await uploadApplicationDocument(accessToken, appId, item.file, item.docType, item.title);
    }
    setPendingUploads([]);
  }

  async function handleSaveDraft(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const draft = await ensureDraft();
      if (pendingUploads.length > 0) {
        await uploadPendingFiles(draft.id);
        const { fetchApplicationDetail } = await import("@/lib/api/applications");
        const refreshed = await fetchApplicationDetail(accessToken, draft.id);
        setApplication(refreshed);
      } else {
        setApplication(draft);
      }
      router.push(`/applications/${draft.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const mapped: Record<string, string> = {};
        Object.entries(err.details).forEach(([k, v]) => {
          mapped[k] = v[0];
        });
        setFieldErrors(mapped);
      }
      setError(err instanceof ApiRequestError ? err.message : "Could not save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const draft = await ensureDraft();
      if (pendingUploads.length > 0) {
        await uploadPendingFiles(draft.id);
      }

      if (draft.status === "DRAFT") {
        await submitApplication(accessToken, draft.id);
      }

      router.push(`/applications/${draft.id}/success`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const mapped: Record<string, string> = {};
        Object.entries(err.details).forEach(([k, v]) => {
          mapped[k] = v[0];
        });
        setFieldErrors(mapped);
      }
      setError(err instanceof ApiRequestError ? err.message : "Could not submit application.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ustawi-navy" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Property not found."}
      </div>
    );
  }

  if (application && application.status !== "DRAFT") {
    return (
      <div className="rounded-2xl border border-ustawi-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-ustawi-muted">You already have an application for this property.</p>
        <Link
          href={`/applications/${application.id}`}
          className="mt-4 inline-flex rounded-full bg-ustawi-red px-6 py-2.5 text-sm font-semibold text-white"
        >
          View application
        </Link>
      </div>
    );
  }

  const uploadedDocs = application?.verification.documents ?? [];
  const location = property.neighborhood
    ? `${property.neighborhood.name}, ${property.city}`
    : property.city;

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-ustawi-border bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ustawi-sand">
          <Image
            src={propertyImageSrc(property.primary_image)}
            alt={property.title}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ustawi-navy">{property.title}</h2>
        <p className="mt-1 text-sm text-ustawi-muted">{location}</p>
        <p className="mt-3 text-xl font-bold text-ustawi-navy">
          {formatPrice(property.price_monthly, property.currency)}
          <span className="text-sm font-normal text-ustawi-muted"> / mo</span>
        </p>
        <Link
          href={`/properties/${property.slug}`}
          className="mt-4 inline-flex text-sm font-semibold text-ustawi-red hover:underline"
        >
          ← Back to property
        </Link>
      </aside>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-ustawi-navy">Application details</h3>
          <p className="mt-1 text-sm text-ustawi-muted">
            Tell the landlord about yourself. You can save a draft and finish later.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="move-in" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Preferred move-in date *
              </label>
              <Input
                id="move-in"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                required
                className={inputClass}
              />
              {fieldErrors.move_in_date && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.move_in_date}</p>
              )}
            </div>
            <div>
              <label htmlFor="income" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Monthly income (KES) *
              </label>
              <Input
                id="income"
                type="number"
                min="0"
                step="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                required
                placeholder="e.g. 120000"
                className={inputClass}
              />
              {fieldErrors.monthly_income && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.monthly_income}</p>
              )}
            </div>
            <div>
              <label htmlFor="employment" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Job title
              </label>
              <Input
                id="employment"
                value={employmentTitle}
                onChange={(e) => setEmploymentTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="employer" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Employer
              </label>
              <Input
                id="employer"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="Company name"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="cover-letter" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
              Cover letter
            </label>
            <textarea
              id="cover-letter"
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself and why you'd be a great tenant…"
              className="w-full rounded-lg border border-[#E8EAF2] bg-white px-3 py-2.5 text-sm text-ustawi-navy placeholder:text-ustawi-muted/60 focus:border-ustawi-navy/30 focus:outline-none focus:ring-2 focus:ring-ustawi-navy/10"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-ustawi-border bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-ustawi-navy">Supporting documents</h3>
          <p className="mt-1 text-sm text-ustawi-muted">
            Upload ID, payslips, or bank statements to strengthen your screening score.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="doc-type" className="mb-1.5 block text-sm font-semibold text-ustawi-navy">
                Document type
              </label>
              <select
                id="doc-type"
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value as ApplicationDocumentType)}
                className={inputClass}
              >
                {APPLICATION_DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ustawi-border bg-ustawi-cream px-4 py-2.5 text-sm font-semibold text-ustawi-navy hover:bg-white">
              <FileUp className="h-4 w-4" />
              Choose file
              <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} />
            </label>
          </div>

          {(pendingUploads.length > 0 || uploadedDocs.length > 0) && (
            <ul className="mt-4 space-y-2">
              {uploadedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
                >
                  <span className="text-emerald-900">{doc.title || doc.doc_type}</span>
                  <span className="text-xs text-emerald-700">Uploaded</span>
                </li>
              ))}
              {pendingUploads.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-ustawi-border px-3 py-2 text-sm"
                >
                  <span>{item.title}</span>
                  <button type="button" onClick={() => removePending(item.id)} className="text-ustawi-muted hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving} className="min-w-[180px]">
            {saving ? "Submitting…" : "Submit application"}
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
            Save draft
          </Button>
          <Link href={`/properties/${property.slug}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
