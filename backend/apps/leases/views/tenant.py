from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.leases.models import Lease, LeaseDocument
from apps.leases.permissions import IsLeaseTenant, IsTenantUser
from apps.leases.serializers import (
    LeaseDetailSerializer,
    LeaseDocumentSerializer,
    LeaseListSerializer,
    LeaseSignSerializer,
)
from apps.leases.services.pdf import ensure_lease_agreement_document, ensure_signed_lease_pdf
from apps.leases.services.workflow import LeaseWorkflowError, refresh_lease_status, sign_lease
from core.pagination import StandardResultsSetPagination


class TenantLeaseListView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Leases"],
        summary="List my leases",
        parameters=[OpenApiParameter("status", str, description="Filter by lease status")],
    )
    def get(self, request):
        qs = (
            Lease.objects.filter(tenant=request.user)
            .select_related("property", "landlord", "landlord__profile", "tenant__profile")
            .order_by("-created_at")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        for lease in qs:
            refresh_lease_status(lease)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = LeaseListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class TenantLeaseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsLeaseTenant]

    def get_object(self, request, pk):
        return (
            Lease.objects.filter(tenant=request.user)
            .select_related("property", "landlord", "landlord__profile", "tenant__profile", "application")
            .prefetch_related("documents", "addendums", "signatures", "signatures__signer__profile")
            .get(pk=pk)
        )

    @extend_schema(tags=["Leases"], summary="Get lease detail")
    def get(self, request, pk):
        lease = refresh_lease_status(self.get_object(request, pk))
        ensure_lease_agreement_document(lease, actor=request.user)
        ensure_signed_lease_pdf(lease)
        lease.refresh_from_db()
        return Response(
            {
                "success": True,
                "data": LeaseDetailSerializer(lease, context={"request": request}).data,
            }
        )


class TenantLeaseSignView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsLeaseTenant]

    @extend_schema(tags=["Leases"], summary="Sign lease as tenant", request=LeaseSignSerializer)
    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk, tenant=request.user)
        serializer = LeaseSignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["role"] != "TENANT":
            return Response(
                {"success": False, "error": {"message": "Tenants must sign with role TENANT."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            sign_lease(lease, request.user, role="TENANT", request=request)
        except LeaseWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lease.refresh_from_db()
        return Response(
            {
                "success": True,
                "message": "Lease signed successfully.",
                "data": {
                    "status": lease.status,
                    "tenant_signed_at": lease.tenant_signed_at,
                    "landlord_signed_at": lease.landlord_signed_at,
                },
            }
        )


class TenantLeaseDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsLeaseTenant]

    @extend_schema(tags=["Leases"], summary="Get shareable lease document download URL")
    def get(self, request, pk, doc_id):
        lease = Lease.objects.get(pk=pk, tenant=request.user)
        doc = LeaseDocument.objects.get(pk=doc_id, lease=lease)
        if not doc.is_shareable:
            return Response(
                {"success": False, "error": {"message": "This document is not shareable."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {
                "success": True,
                "data": LeaseDocumentSerializer(doc, context={"request": request}).data,
            }
        )
