from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.verification.permissions import IsAdminUser, IsInspectorOrAdmin
from apps.verification.services.analytics import get_pipeline_stats


class VerificationPipelineStatsView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(
        tags=["Admin Verification"],
        summary="Verification pipeline stats for admin dashboard",
    )
    def get(self, request):
        return Response({"success": True, "data": get_pipeline_stats()})


class AdminVerificationOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["Admin Verification"], summary="Admin verification overview KPIs")
    def get(self, request):
        from apps.properties.models import Property, PropertyStatus
        from apps.verification.models import VerificationCase, VerificationCaseStatus

        stats = get_pipeline_stats()
        stats["active_listings"] = Property.objects.filter(status=PropertyStatus.ACTIVE).count()
        stats["verified_listings"] = Property.objects.filter(is_verified=True).count()
        stats["pending_verifications"] = VerificationCase.objects.filter(
            status__in=[
                VerificationCaseStatus.PENDING,
                VerificationCaseStatus.IN_REVIEW,
                VerificationCaseStatus.AWAITING_DOCS,
            ]
        ).count()
        return Response({"success": True, "data": stats})
