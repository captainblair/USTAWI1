from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.maintenance.models import MaintenancePhoto, MaintenanceRequest
from apps.maintenance.permissions import IsMaintenanceTenant, IsTenantUser
from apps.maintenance.serializers import (
    MaintenanceCreateSerializer,
    MaintenanceDetailSerializer,
    MaintenanceListSerializer,
    MaintenancePhotoUploadSerializer,
)
from apps.maintenance.services.workflow import (
    MaintenanceWorkflowError,
    create_maintenance_request,
    validate_photo_upload,
)
from core.pagination import StandardResultsSetPagination


class TenantMaintenanceListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardResultsSetPagination
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        tags=["Maintenance"],
        summary="List my maintenance requests",
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("category", str),
        ],
    )
    def get(self, request):
        qs = (
            MaintenanceRequest.objects.filter(tenant=request.user)
            .select_related("property")
            .prefetch_related("photos")
            .order_by("-created_at")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = MaintenanceListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Maintenance"],
        summary="Submit maintenance request with photos (up to 5, 10 MB each)",
        request=MaintenanceCreateSerializer,
    )
    def post(self, request):
        data = {
            "lease_id": request.data.get("lease_id"),
            "title": request.data.get("title"),
            "description": request.data.get("description"),
            "category": request.data.get("category"),
            "urgency": request.data.get("urgency", "MEDIUM"),
            "unit_label": request.data.get("unit_label", ""),
        }
        serializer = MaintenanceCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        lease = serializer.validated_data["lease_id"]
        payload = {k: v for k, v in serializer.validated_data.items() if k != "lease_id"}
        try:
            request_obj = create_maintenance_request(
                request.user,
                lease,
                payload,
            )
        except MaintenanceWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photos = request.FILES.getlist("photos") or request.FILES.getlist("photo") or []
        if not photos and request.FILES.get("image"):
            photos = [request.FILES["image"]]

        try:
            validate_photo_upload(request_obj, len(photos))
        except MaintenanceWorkflowError as exc:
            request_obj.delete()
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for idx, photo_file in enumerate(photos):
            photo_serializer = MaintenancePhotoUploadSerializer(data={"image": photo_file})
            photo_serializer.is_valid(raise_exception=True)
            MaintenancePhoto.objects.create(
                request=request_obj,
                image=photo_serializer.validated_data["image"],
                caption=photo_serializer.validated_data.get("caption", ""),
                sort_order=idx,
            )

        request_obj = MaintenanceRequest.objects.prefetch_related("photos", "updates").get(pk=request_obj.pk)
        return Response(
            {
                "success": True,
                "message": "Maintenance request submitted.",
                "data": MaintenanceDetailSerializer(request_obj, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TenantMaintenanceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsMaintenanceTenant]

    @extend_schema(tags=["Maintenance"], summary="Get maintenance request detail")
    def get(self, request, pk):
        request_obj = (
            MaintenanceRequest.objects.filter(tenant=request.user)
            .select_related("property", "lease")
            .prefetch_related("photos", "updates", "updates__actor", "updates__actor__profile")
            .get(pk=pk)
        )
        return Response(
            {
                "success": True,
                "data": MaintenanceDetailSerializer(request_obj, context={"request": request}).data,
            }
        )


class TenantMaintenancePhotoView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsMaintenanceTenant]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        tags=["Maintenance"],
        summary="Add photo to maintenance request",
        request=MaintenancePhotoUploadSerializer,
    )
    def post(self, request, pk):
        request_obj = MaintenanceRequest.objects.get(pk=pk, tenant=request.user)
        try:
            validate_photo_upload(request_obj, 1)
        except MaintenanceWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MaintenancePhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photo = MaintenancePhoto.objects.create(
            request=request_obj,
            image=serializer.validated_data["image"],
            caption=serializer.validated_data.get("caption", ""),
            sort_order=request_obj.photos.count(),
        )
        from apps.maintenance.serializers import MaintenancePhotoSerializer

        return Response(
            {
                "success": True,
                "message": "Photo added.",
                "data": MaintenancePhotoSerializer(photo, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
