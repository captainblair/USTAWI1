from django.urls import path

from apps.applications.views.landlord import (
    LandlordApplicationApproveView,
    LandlordApplicationDetailView,
    LandlordApplicationInboxView,
    LandlordApplicationRejectView,
    LandlordApplicationReviewView,
)
from apps.applications.views.tenant import (
    TenantApplicationDetailView,
    TenantApplicationDocumentView,
    TenantApplicationListCreateView,
    TenantApplicationSubmitView,
    TenantApplicationWithdrawView,
)

tenant_urlpatterns = [
    path("", TenantApplicationListCreateView.as_view(), name="tenant-application-list"),
    path("<uuid:pk>/", TenantApplicationDetailView.as_view(), name="tenant-application-detail"),
    path("<uuid:pk>/submit/", TenantApplicationSubmitView.as_view(), name="tenant-application-submit"),
    path("<uuid:pk>/withdraw/", TenantApplicationWithdrawView.as_view(), name="tenant-application-withdraw"),
    path("<uuid:pk>/documents/", TenantApplicationDocumentView.as_view(), name="tenant-application-document"),
]

landlord_urlpatterns = [
    path("", LandlordApplicationInboxView.as_view(), name="landlord-application-inbox"),
    path("<uuid:pk>/", LandlordApplicationDetailView.as_view(), name="landlord-application-detail"),
    path("<uuid:pk>/review/", LandlordApplicationReviewView.as_view(), name="landlord-application-review"),
    path("<uuid:pk>/approve/", LandlordApplicationApproveView.as_view(), name="landlord-application-approve"),
    path("<uuid:pk>/reject/", LandlordApplicationRejectView.as_view(), name="landlord-application-reject"),
]
