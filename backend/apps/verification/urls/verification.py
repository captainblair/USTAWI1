from django.urls import path

from apps.verification.views.admin import AdminVerificationOverviewView, VerificationPipelineStatsView
from apps.verification.views.community import CommunityReportCreateView, PropertyCommunityReportListView
from apps.verification.views.inspector import (
    InspectorApproveView,
    InspectorCaseDetailView,
    InspectorDocumentReviewView,
    InspectorPhotoReviewView,
    InspectorQueueView,
    InspectorRejectView,
    InspectorRequestChangesView,
    InspectorSafetyScoreView,
    InspectorStartReviewView,
)

inspector_urlpatterns = [
    path("queue/", InspectorQueueView.as_view(), name="inspector-queue"),
    path("cases/<uuid:pk>/", InspectorCaseDetailView.as_view(), name="inspector-case-detail"),
    path("cases/<uuid:pk>/review/", InspectorStartReviewView.as_view(), name="inspector-start-review"),
    path("cases/<uuid:pk>/safety-score/", InspectorSafetyScoreView.as_view(), name="inspector-safety-score"),
    path(
        "cases/<uuid:pk>/documents/<uuid:doc_id>/",
        InspectorDocumentReviewView.as_view(),
        name="inspector-document-review",
    ),
    path(
        "cases/<uuid:pk>/photos/<uuid:photo_id>/",
        InspectorPhotoReviewView.as_view(),
        name="inspector-photo-review",
    ),
    path("cases/<uuid:pk>/approve/", InspectorApproveView.as_view(), name="inspector-approve"),
    path("cases/<uuid:pk>/reject/", InspectorRejectView.as_view(), name="inspector-reject"),
    path(
        "cases/<uuid:pk>/request-changes/",
        InspectorRequestChangesView.as_view(),
        name="inspector-request-changes",
    ),
]

admin_urlpatterns = [
    path("pipeline/", VerificationPipelineStatsView.as_view(), name="verification-pipeline"),
    path("overview/", AdminVerificationOverviewView.as_view(), name="verification-overview"),
]

community_urlpatterns = [
    path("", CommunityReportCreateView.as_view(), name="community-report-create"),
    path(
        "property/<uuid:property_id>/",
        PropertyCommunityReportListView.as_view(),
        name="property-community-reports",
    ),
]
