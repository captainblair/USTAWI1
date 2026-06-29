from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.filters import TenantApplicationFilter
from apps.applications.models import ApplicationStatus, RentalApplication
from apps.applications.permissions import IsApplicationTenant, IsTenantUser
from apps.applications.serializers import (
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationDocumentUploadSerializer,
    ApplicationListSerializer,
    ApplicationUpdateSerializer,
)
from apps.applications.services.workflow import ApplicationWorkflowError, submit_application, withdraw_application
from core.pagination import StandardResultsSetPagination


class TenantApplicationListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Applications"],
        summary="List my rental applications",
        parameters=[OpenApiParameter("status", str, description="Filter by status tab")],
    )
    def get(self, request):
        qs = (
            RentalApplication.objects.filter(tenant=request.user)
            .select_related("property", "property__neighborhood")
            .prefetch_related("property__images", "property__amenities")
            .order_by("-created_at")
        )
        app_filter = TenantApplicationFilter(request.query_params, queryset=qs)
        qs = app_filter.qs

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ApplicationListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(tags=["Applications"], summary="Create application (draft or submit)")
    def post(self, request):
        serializer = ApplicationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            {
                "success": True,
                "message": (
                    "Application submitted successfully."
                    if application.status == ApplicationStatus.SUBMITTED
                    else "Application saved as draft."
                ),
                "data": ApplicationDetailSerializer(application, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TenantApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsApplicationTenant]

    def get_object(self, request, pk):
        return RentalApplication.objects.select_related(
            "property", "property__neighborhood", "tenant", "tenant__profile"
        ).prefetch_related("documents", "references", "events", "property__images").get(
            pk=pk, tenant=request.user
        )

    @extend_schema(tags=["Applications"], summary="Get application detail with tabs")
    def get(self, request, pk):
        application = self.get_object(request, pk)
        return Response(
            {
                "success": True,
                "data": ApplicationDetailSerializer(application, context={"request": request}).data,
            }
        )

    @extend_schema(tags=["Applications"], summary="Update draft application")
    def patch(self, request, pk):
        application = self.get_object(request, pk)
        if application.status != ApplicationStatus.DRAFT:
            return Response(
                {"success": False, "error": {"message": "Only draft applications can be edited."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ApplicationUpdateSerializer(
            application, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Application updated.",
                "data": ApplicationDetailSerializer(application, context={"request": request}).data,
            }
        )


class TenantApplicationSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsApplicationTenant]

    @extend_schema(tags=["Applications"], summary="Submit draft application")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, tenant=request.user)
        try:
            submit_application(application, actor=request.user)
        except ApplicationWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Application submitted successfully.",
                "data": {
                    "id": str(application.id),
                    "status": application.status,
                    "screening_score": application.screening_score,
                    "next_steps": [
                        "Landlord reviews your profile.",
                        "We'll notify you of updates.",
                        "Expect a response within 2–3 business days.",
                    ],
                },
            }
        )


class TenantApplicationWithdrawView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsApplicationTenant]

    @extend_schema(tags=["Applications"], summary="Withdraw application")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, tenant=request.user)
        try:
            withdraw_application(application, actor=request.user)
        except ApplicationWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Application withdrawn.",
                "data": {"id": str(application.id), "status": application.status},
            }
        )


class TenantApplicationDocumentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsApplicationTenant]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["Applications"], summary="Upload application document")
    def post(self, request, pk):
        application = RentalApplication.objects.get(pk=pk, tenant=request.user)
        if application.status not in (ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
            return Response(
                {"success": False, "error": {"message": "Cannot upload documents for this application status."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ApplicationDocumentUploadSerializer(
            data=request.data,
            context={"application": application, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Document uploaded.",
                "data": ApplicationDocumentUploadSerializer(doc).data,
            },
            status=status.HTTP_201_CREATED,
        )
