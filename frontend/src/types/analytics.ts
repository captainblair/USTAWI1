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
};
