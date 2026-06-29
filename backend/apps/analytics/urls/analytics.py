from django.urls import path

from apps.analytics.views.dashboards import (
    AdminDashboardView,
    ChartApplicationsView,
    ChartOccupancyView,
    ChartRevenueView,
    ChartUserGrowthView,
    LandlordDashboardView,
    TenantDashboardView,
    TenantRecommendationsView,
)

urlpatterns = [
    path("tenant/dashboard/", TenantDashboardView.as_view(), name="tenant-dashboard"),
    path("tenant/recommendations/", TenantRecommendationsView.as_view(), name="tenant-recommendations"),
    path("landlord/dashboard/", LandlordDashboardView.as_view(), name="landlord-dashboard"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("charts/revenue/", ChartRevenueView.as_view(), name="chart-revenue"),
    path("charts/applications/", ChartApplicationsView.as_view(), name="chart-applications"),
    path("charts/user-growth/", ChartUserGrowthView.as_view(), name="chart-user-growth"),
    path("charts/occupancy/", ChartOccupancyView.as_view(), name="chart-occupancy"),
]
