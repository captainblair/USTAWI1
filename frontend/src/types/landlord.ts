import type { ChartData } from "@/types/analytics";

export type LandlordDashboardKpis = {
  total_properties: number;
  active_listings: number;
  occupied_properties: number;
  active_leases: number;
  occupancy_rate: number;
  monthly_income: number;
  currency: string;
  pending_applications: number;
  pending_verification: number;
};

export type LandlordTopPerformer = {
  id: string;
  title: string;
  status: string;
  views_count: number;
  safety_score: number;
  application_count: number;
  monthly_rent: number;
};

export type LandlordDashboard = {
  kpis: LandlordDashboardKpis;
  top_performers: LandlordTopPerformer[];
  charts: {
    revenue_trend: ChartData;
    applications_by_status: ChartData;
    occupancy_breakdown: ChartData;
  };
};

export type LandlordApplicationInboxItem = {
  id: string;
  tenant_name: string;
  tenant_email: string;
  property_title: string;
  property_location: string;
  status: string;
  move_in_date: string | null;
  monthly_income: string | null;
  screening_score: number | null;
  screening_label: string | null;
  income_rent_ratio: number | null;
  verified_id: boolean;
  verified_income: boolean;
  submitted_at: string | null;
  created_at: string;
};

export type LandlordPropertyCreatePayload = {
  title: string;
  description: string;
  property_type: string;
  address: string;
  city: string;
  neighborhood_slug?: string;
  price_monthly: number;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  furnished?: boolean;
  pet_friendly?: boolean;
  amenity_slugs?: string[];
  latitude?: number;
  longitude?: number;
};

export type LandlordPropertyUpdatePayload = Partial<LandlordPropertyCreatePayload>;
