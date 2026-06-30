import type { PropertyListItem } from "@/types/property";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type ApplicationDocumentType =
  | "NATIONAL_ID"
  | "PAYSLIP"
  | "BANK_STATEMENT"
  | "EMPLOYMENT_LETTER"
  | "REFERENCE_LETTER"
  | "OTHER";

export type ApplicationDocument = {
  id: string;
  title: string;
  document: string;
  doc_type: ApplicationDocumentType;
  created_at: string;
};

export type ApplicationReference = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notes: string;
  created_at: string;
};

export type ApplicationEvent = {
  id: string;
  event_type: string;
  actor_name: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ApplicationSummary = {
  id: string;
  status: ApplicationStatus;
  tenant_name: string;
  tenant_email: string;
  property_title: string;
  property_location: string;
  move_in_date: string | null;
  monthly_income: string;
  cover_letter: string;
  screening_score: number;
  screening_label: string;
  submitted_at: string | null;
};

export type ApplicationVerification = {
  screening_score: number;
  screening_label: string;
  risk_level: string;
  income_rent_ratio: number | null;
  income_vs_rent_summary: string;
  verified_id: boolean;
  verified_income: boolean;
  verified_phone: boolean;
  employment_title: string;
  employer: string;
  monthly_income: string;
  documents: ApplicationDocument[];
};

export type ApplicationListItem = {
  id: string;
  property: PropertyListItem;
  tenant_name: string;
  status: ApplicationStatus;
  move_in_date: string | null;
  monthly_income: string;
  screening_score: number;
  screening_label: string;
  submitted_at: string | null;
  created_at: string;
};

export type ApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  property: PropertyListItem;
  summary: ApplicationSummary;
  verification: ApplicationVerification;
  references: ApplicationReference[];
  timeline: ApplicationEvent[];
  rejection_reason: string;
  landlord_notes: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationCreatePayload = {
  property_id: string;
  move_in_date?: string;
  cover_letter?: string;
  employment_title?: string;
  employer?: string;
  monthly_income?: string | number;
  references?: Array<{
    name: string;
    relationship?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }>;
  submit?: boolean;
};

export type ApplicationUpdatePayload = Partial<
  Omit<ApplicationCreatePayload, "property_id" | "submit">
>;

export type ApplicationSubmitResponse = {
  id: string;
  status: ApplicationStatus;
  screening_score: number;
  next_steps: string[];
};

export const APPLICATION_DOCUMENT_TYPES: { value: ApplicationDocumentType; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PAYSLIP", label: "Payslip" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "EMPLOYMENT_LETTER", label: "Employment letter" },
  { value: "REFERENCE_LETTER", label: "Reference letter" },
  { value: "OTHER", label: "Other" },
];
