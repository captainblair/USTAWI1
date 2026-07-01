export type VerificationCaseStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "AWAITING_DOCS"
  | "REJECTED"
  | "APPROVED";

export type VerificationStage =
  | "DOCUMENT_REVIEW"
  | "ON_SITE_INSPECTION"
  | "SAFETY_SCORING"
  | "FINAL_REVIEW";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VerificationCaseListItem = {
  id: string;
  property_id: string;
  property_title: string;
  property_location: string;
  owner_name: string;
  status: VerificationCaseStatus;
  stage: VerificationStage;
  risk_level: string;
  safety_score: string;
  submitted_at: string;
  assigned_inspector: string | null;
};

export type VerificationDocument = {
  id: string;
  doc_type: string;
  title: string;
  file: string;
  status: ReviewStatus;
  reviewer_notes: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type VerificationPhoto = {
  id: string;
  image_url: string;
  caption: string;
  verification_status: ReviewStatus;
  verification_notes: string;
  sort_order: number;
};

export type SafetyScoreFactor = {
  factor_type: string;
  score: string;
  max_score: string;
  notes: string;
};

export type SafetyScoreDetail = {
  overall_score: string;
  notes: string;
  factors: SafetyScoreFactor[];
  updated_at: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  actor_name: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type VerificationCaseDetail = VerificationCaseListItem & {
  documents: VerificationDocument[];
  photos: VerificationPhoto[];
  safety_score_detail: SafetyScoreDetail | null;
  audit_trail: AuditLogEntry[];
  inspector_notes: string;
  rejection_reason: string;
  changes_requested: string;
  completed_at: string | null;
};

export type VerificationQueueResponse = {
  success: true;
  count: number;
  next: string | null;
  previous: string | null;
  results: VerificationCaseListItem[];
  tab_counts: {
    pending: number;
    in_review: number;
    awaiting_docs: number;
    rejected: number;
  };
};

export type VerificationPipelineStats = {
  pending: number;
  in_review: number;
  awaiting_docs: number;
  rejected: number;
  total_open: number;
  breakdown: { status: string; count: number }[];
  active_listings?: number;
  verified_listings?: number;
  pending_verifications?: number;
};

export type SafetyScoreFormData = {
  neighborhood: number;
  building_condition: number;
  access_control: number;
  lighting: number;
  emergency_readiness: number;
  notes?: string;
};

export type CommunityReport = {
  id: string;
  property_id: string;
  property_title: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  is_public: boolean;
  reporter_name: string;
  created_at: string;
};
