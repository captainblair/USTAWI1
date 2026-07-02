from django.urls import path

from apps.leases.views.landlord import (
    LandlordCreateLeaseFromApplicationView,
    LandlordLeaseAddendumView,
    LandlordLeaseDetailView,
    LandlordLeaseDocumentFileView,
    LandlordLeaseDocumentShareView,
    LandlordLeaseDocumentUploadView,
    LandlordLeaseListView,
    LandlordLeaseSignedPdfDownloadView,
    LandlordLeaseSignView,
    LandlordLeaseTerminateView,
)
from apps.leases.views.tenant import (
    TenantLeaseDetailView,
    TenantLeaseDocumentDownloadView,
    TenantLeaseDocumentFileView,
    TenantLeaseListView,
    TenantLeaseSignedPdfDownloadView,
    TenantLeaseSignView,
)

tenant_urlpatterns = [
    path("", TenantLeaseListView.as_view(), name="tenant-lease-list"),
    path("<uuid:pk>/", TenantLeaseDetailView.as_view(), name="tenant-lease-detail"),
    path("<uuid:pk>/sign/", TenantLeaseSignView.as_view(), name="tenant-lease-sign"),
    path(
        "<uuid:pk>/documents/<uuid:doc_id>/",
        TenantLeaseDocumentDownloadView.as_view(),
        name="tenant-lease-document",
    ),
    path(
        "<uuid:pk>/documents/<uuid:doc_id>/download/",
        TenantLeaseDocumentFileView.as_view(),
        name="tenant-lease-document-download",
    ),
    path(
        "<uuid:pk>/signed-pdf/download/",
        TenantLeaseSignedPdfDownloadView.as_view(),
        name="tenant-lease-signed-pdf-download",
    ),
]

landlord_urlpatterns = [
    path("", LandlordLeaseListView.as_view(), name="landlord-lease-list"),
    path(
        "from-application/<uuid:application_id>/",
        LandlordCreateLeaseFromApplicationView.as_view(),
        name="landlord-lease-from-application",
    ),
    path("<uuid:pk>/", LandlordLeaseDetailView.as_view(), name="landlord-lease-detail"),
    path("<uuid:pk>/sign/", LandlordLeaseSignView.as_view(), name="landlord-lease-sign"),
    path("<uuid:pk>/terminate/", LandlordLeaseTerminateView.as_view(), name="landlord-lease-terminate"),
    path("<uuid:pk>/documents/", LandlordLeaseDocumentUploadView.as_view(), name="landlord-lease-document-upload"),
    path(
        "<uuid:pk>/documents/<uuid:doc_id>/",
        LandlordLeaseDocumentShareView.as_view(),
        name="landlord-lease-document-share",
    ),
    path(
        "<uuid:pk>/documents/<uuid:doc_id>/download/",
        LandlordLeaseDocumentFileView.as_view(),
        name="landlord-lease-document-download",
    ),
    path(
        "<uuid:pk>/signed-pdf/download/",
        LandlordLeaseSignedPdfDownloadView.as_view(),
        name="landlord-lease-signed-pdf-download",
    ),
    path("<uuid:pk>/addendums/", LandlordLeaseAddendumView.as_view(), name="landlord-lease-addendum"),
]
