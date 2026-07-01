export type SupportCaseStatus = "OPEN" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED";

export type SupportCaseListItem = {
  id: string;
  case_number: string;
  category: string;
  urgency: number;
  status: SupportCaseStatus;
  subject: string;
  attachment_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type CaseMessage = {
  id: string;
  sender_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type CaseAttachment = {
  id: string;
  filename: string;
  file_url: string | null;
  created_at: string;
};

export type SupportCaseDetail = SupportCaseListItem & {
  description: string;
  resolution_notes: string;
  property_id: string | null;
  lease_id: string | null;
  attachments: CaseAttachment[];
  messages: CaseMessage[];
  assigned_admin_name: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
};
