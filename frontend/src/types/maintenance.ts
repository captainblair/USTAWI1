export type MaintenanceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "APPLIANCE"
  | "STRUCTURAL"
  | "PEST_CONTROL"
  | "SECURITY"
  | "OTHER";

export type MaintenanceUrgency = "LOW" | "MEDIUM" | "HIGH";

export type MaintenanceStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type MaintenanceUpdateType = "CREATED" | "STATUS_CHANGE" | "ASSIGNMENT" | "NOTE";

export type MaintenancePhoto = {
  id: string;
  image_url: string | null;
  caption: string;
  sort_order: number;
  created_at: string;
};

export type MaintenanceTimelineEntry = {
  id: string;
  update_type: MaintenanceUpdateType;
  actor_name: string;
  old_status: string;
  new_status: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MaintenanceListItem = {
  id: string;
  title: string;
  property_title: string;
  unit_label: string;
  category: MaintenanceCategory;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  photo_count: number;
  assigned_technician_name: string;
  created_at: string;
  updated_at: string;
};

export type LandlordMaintenanceListItem = MaintenanceListItem & {
  tenant_name: string;
};

export type MaintenanceDetail = MaintenanceListItem & {
  description: string;
  lease_id: string;
  property_id: string;
  photos: MaintenancePhoto[];
  timeline: MaintenanceTimelineEntry[];
  assigned_technician_phone: string;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
};

export type CreateMaintenancePayload = {
  lease_id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  urgency: MaintenanceUrgency;
  unit_label?: string;
  photos?: File[];
};

export type AssignTechnicianPayload = {
  technician_name: string;
  technician_phone?: string;
  note?: string;
};
