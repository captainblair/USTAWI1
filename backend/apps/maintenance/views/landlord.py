from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.maintenance.models import MaintenanceRequest
from apps.maintenance.permissions import IsLandlordAgentOrAdmin, IsMaintenanceLandlord
from apps.maintenance.serializers import (
    AssignTechnicianSerializer,
    LandlordMaintenanceListSerializer,
    MaintenanceDetailSerializer,
    MaintenanceStatusUpdateSerializer,
)
from apps.maintenance.services.workflow import (
    MaintenanceWorkflowError,
    assign_technician,
    update_status,
)
from core.pagination import StandardResultsSetPagination


class LandlordMaintenanceListView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Landlord Maintenance"],
        summary="List maintenance requests for landlord properties",
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("urgency", str),
            OpenApiParameter("property_id", str),
        ],
    )
    def get(self, request):
        qs = (
            MaintenanceRequest.objects.filter(landlord=request.user)
            .select_related("property", "tenant", "tenant__profile")
            .prefetch_related("photos")
            .order_by("-created_at")
        )
        for param, field in [("status", "status"), ("urgency", "urgency"), ("property_id", "property_id")]:
            value = request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = LandlordMaintenanceListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class LandlordMaintenanceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsMaintenanceLandlord]

    @extend_schema(tags=["Landlord Maintenance"], summary="Maintenance request detail")
    def get(self, request, pk):
        request_obj = (
            MaintenanceRequest.objects.filter(landlord=request.user)
            .select_related("property", "lease", "tenant", "tenant__profile")
            .prefetch_related("photos", "updates", "updates__actor", "updates__actor__profile")
            .get(pk=pk)
        )
        return Response(
            {
                "success": True,
                "data": MaintenanceDetailSerializer(request_obj, context={"request": request}).data,
            }
        )


class LandlordMaintenanceAssignView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsMaintenanceLandlord]

    @extend_schema(
        tags=["Landlord Maintenance"],
        summary="Assign technician to maintenance request",
        request=AssignTechnicianSerializer,
    )
    def post(self, request, pk):
        request_obj = MaintenanceRequest.objects.get(pk=pk, landlord=request.user)
        serializer = AssignTechnicianSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            assign_technician(
                request_obj,
                request.user,
                name=serializer.validated_data["technician_name"],
                phone=serializer.validated_data.get("technician_phone", ""),
                note=serializer.validated_data.get("note", ""),
            )
        except MaintenanceWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Technician assigned.",
                "data": {
                    "id": str(request_obj.id),
                    "status": request_obj.status,
                    "assigned_technician_name": request_obj.assigned_technician_name,
                },
            }
        )


class LandlordMaintenanceStatusView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsMaintenanceLandlord]

    @extend_schema(
        tags=["Landlord Maintenance"],
        summary="Update maintenance request status",
        request=MaintenanceStatusUpdateSerializer,
    )
    def patch(self, request, pk):
        request_obj = MaintenanceRequest.objects.get(pk=pk, landlord=request.user)
        serializer = MaintenanceStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            update_status(
                request_obj,
                request.user,
                new_status=serializer.validated_data["status"],
                message=serializer.validated_data.get("message", ""),
            )
        except MaintenanceWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Status updated.",
                "data": {"id": str(request_obj.id), "status": request_obj.status},
            }
        )


class LandlordMaintenanceRecentView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Maintenance"], summary="Recent maintenance activity for dashboard")
    def get(self, request):
        qs = (
            MaintenanceRequest.objects.filter(landlord=request.user)
            .select_related("property", "tenant", "tenant__profile")
            .order_by("-updated_at")[:10]
        )
        return Response(
            {
                "success": True,
                "data": LandlordMaintenanceListSerializer(qs, many=True, context={"request": request}).data,
            }
        )
