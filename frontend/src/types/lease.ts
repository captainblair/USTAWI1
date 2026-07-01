export type LeaseStatus =
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "TERMINATED";

export type LeaseDocumentType =
  | "LEASE_AGREEMENT"
  | "ADDENDUM"
  | "SERVICE_CONTRACT"
  | "SIGNED_COPY";

export type LeaseSignatureStatus = {
  tenant_signed: boolean;
  landlord_signed: boolean;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
};

export type LeaseRenewalReminder = {
  days_until_end: number;
  renewal_due_soon: boolean;
  renewal_reminder_days: number;
  end_date: string;
};

export type LeaseRentDue = {
  is_due: boolean;
  invoice_id?: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  due_date?: string;
  status?: string;
  days_overdue?: number;
  billing_period_start?: string;
  billing_period_end?: string;
};

export type LeaseDocument = {
  id: string;
  doc_type: LeaseDocumentType;
  title: string;
  file_url: string | null;
  is_shareable: boolean;
  uploaded_by_name: string | null;
  created_at: string;
};

export type LeaseAddendum = {
  id: string;
  title: string;
  description: string;
  effective_date: string;
  document: LeaseDocument | null;
  created_at: string;
};

export type LeaseSignature = {
  id: string;
  signer_role: "TENANT" | "LANDLORD";
  signer_name: string;
  signature_method: string;
  signed_at: string;
};

export type LeaseListItem = {
  id: string;
  property_title: string;
  property_address: string;
  counterparty_name: string;
  status: LeaseStatus;
  effective_status: LeaseStatus;
  rent_amount: string;
  currency: string;
  rent_due_day: number;
  furnished: boolean;
  start_date: string;
  end_date: string;
  duration_months: number;
  signature_status: LeaseSignatureStatus;
  renewal_reminder: LeaseRenewalReminder;
  rent_due: LeaseRentDue;
  created_at: string;
};

export type LeaseDetail = LeaseListItem & {
  property_id: string;
  application_id: string;
  tenant_name: string;
  landlord_name: string;
  deposit_amount: string;
  notes: string;
  termination_reason: string;
  activated_at: string | null;
  terminated_at: string | null;
  signed_pdf_url: string | null;
  documents: LeaseDocument[];
  addendums: LeaseAddendum[];
  signatures: LeaseSignature[];
};

export type LeaseSignResponse = {
  status: LeaseStatus;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
};
