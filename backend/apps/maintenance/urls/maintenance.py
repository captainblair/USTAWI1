from django.urls import path

from apps.maintenance.views.landlord import (
    LandlordMaintenanceAssignView,
    LandlordMaintenanceDetailView,
    LandlordMaintenanceListView,
    LandlordMaintenanceRecentView,
    LandlordMaintenanceStatusView,
)
from apps.maintenance.views.tenant import (
    TenantMaintenanceDetailView,
    TenantMaintenanceListCreateView,
    TenantMaintenancePhotoView,
)

tenant_urlpatterns = [
    path("", TenantMaintenanceListCreateView.as_view(), name="tenant-maintenance-list"),
    path("<uuid:pk>/", TenantMaintenanceDetailView.as_view(), name="tenant-maintenance-detail"),
    path("<uuid:pk>/photos/", TenantMaintenancePhotoView.as_view(), name="tenant-maintenance-photo"),
]

landlord_urlpatterns = [
    path("", LandlordMaintenanceListView.as_view(), name="landlord-maintenance-list"),
    path("recent/", LandlordMaintenanceRecentView.as_view(), name="landlord-maintenance-recent"),
    path("<uuid:pk>/", LandlordMaintenanceDetailView.as_view(), name="landlord-maintenance-detail"),
    path("<uuid:pk>/assign/", LandlordMaintenanceAssignView.as_view(), name="landlord-maintenance-assign"),
    path("<uuid:pk>/status/", LandlordMaintenanceStatusView.as_view(), name="landlord-maintenance-status"),
]
