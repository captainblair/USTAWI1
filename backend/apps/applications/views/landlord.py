from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.filters import (
    LandlordApplicationFilter,
    exclude_draft_for_landlord,
    sort_landlord_applications,
)
from apps.applications.models import RentalApplication
from apps.applications.permissions import IsApplicationLandlord, IsLandlordAgentOrAdmin
from apps.applications.serializers import (
    ApplicationDetailSerializer,
    ApproveApplicationSerializer,
    LandlordInboxSerializer,
    RejectApplicationSerializer,
)
from apps.applications.services.workflow import (
    ApplicationWorkflowError,
    approve_application,
    mark_under_review,
    reject_application,
)
from core.pagination import StandardResultsSetPagination


class LandlordApplicationInboxView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Landlord Applications"],
        summary="Tenant application inbox",
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("property_id", str),
            OpenApiParameter("min_score", int),
            OpenApiParameter("q", str, description="Search tenant name or property"),
            OpenApiParameter("sort", str, description="score, -score, date, newest"),
        ],
    )
    def get(self, request):
        qs = (
            RentalApplication.objects.filter(property__owner=request.user)
            .select_related("tenant", "tenant__profile", "property", "property__neighborhood")
            .prefetch_related("property__images")
        )
        qs = exclude_draft_for_landlord(qs)

        app_filter = LandlordApplicationFilter(request.query_params, queryset=qs)
        qs = sort_landlord_applications(app_filter.qs, request.query_params.get("sort", "score"))

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = LandlordInboxSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class LandlordApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsApplicationLandlord]

    def get_object(self, request, pk):
        return RentalApplication.objects.select_related(
            "property", "property__neighborhood", "tenant", "tenant__profile"
        ).prefetch_related("documents", "references", "events", "property__images").get(
            pk=pk, property__owner=request.user
        )

    @extend_schema(
        tags=["Landlord Applications"],
        summary="Application detail (Summary, Verification, References, Timeline tabs)",
    )
    def get(self, request, pk):
        application = self.get_object(request, pk)
        return Response(
            {
                "success": True,
                "data": ApplicationDetailSerializer(application, context={"request": request}).data,
            }
        )


class LandlordApplicationReviewView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsApplicationLandlord]

    @extend_schema(tags=["Landlord Applications"], summary="Mark application as under review")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, property__owner=request.user)
        try:
            mark_under_review(application, actor=request.user)
        except ApplicationWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Application marked as under review.",
                "data": {"id": str(application.id), "status": application.status},
            }
        )


class LandlordApplicationApproveView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsApplicationLandlord]

    @extend_schema(tags=["Landlord Applications"], summary="Approve application")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, property__owner=request.user)
        serializer = ApproveApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            approve_application(
                application,
                actor=request.user,
                notes=serializer.validated_data.get("notes", ""),
            )
        except ApplicationWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Application approved.",
                "data": {"id": str(application.id), "status": application.status},
            }
        )


class LandlordApplicationRejectView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsApplicationLandlord]

    @extend_schema(tags=["Landlord Applications"], summary="Reject application")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, property__owner=request.user)
        serializer = RejectApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reject_application(
                application,
                actor=request.user,
                reason=serializer.validated_data.get("reason", ""),
            )
        except ApplicationWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Application rejected.",
                "data": {
                    "id": str(application.id),
                    "status": application.status,
                    "rejection_reason": application.rejection_reason,
                },
            }
        )
