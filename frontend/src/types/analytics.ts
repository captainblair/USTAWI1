import type { PropertyListItem } from "@/types/property";

export type ChartDataset = {
  label?: string;
  data: number[];
  currency?: string;
};

export type ChartData = {
  type: "line" | "bar" | "donut";
  labels: string[];
  datasets: ChartDataset[];
};

export type AdminDashboardKpis = {
  total_users: number;
  new_users_this_month: number;
  users_by_role: Record<string, number>;
  total_revenue: number;
  revenue_this_month: number;
  currency: string;
  active_listings: number;
  occupied_properties: number;
  active_leases: number;
  platform_occupancy_rate: number;
  pending_verifications: number;
};

export type AdminDashboard = {
  kpis: AdminDashboardKpis;
  charts: {
    user_growth: ChartData;
    revenue_trend: ChartData;
    verification_pipeline: ChartData;
    listings_by_status: ChartData;
    occupancy_breakdown: ChartData;
  };
};

export type TenantActiveLease = {
  id: string;
  property_title: string;
  property_id: string;
  status: string;
  rent_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  safety_score: number;
};

export type TenantUpcomingRent = {
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

export type TenantRecentApplication = {
  id: string;
  property_title: string;
  status: string;
  screening_score: number | null;
  submitted_at: string | null;
  updated_at: string;
};

export type TenantDashboard = {
  kpis: {
    active_lease: TenantActiveLease | null;
    upcoming_rent: TenantUpcomingRent | null;
    safety_score: number | null;
    pending_applications: number;
  };
  recent_applications: TenantRecentApplication[];
  recommendations: PropertyListItem[];
  charts: {
    payment_history: ChartData;
    application_status: ChartData;
  };
};
