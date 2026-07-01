from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import RentalApplication
from apps.leases.models import Lease, LeaseAddendum, LeaseDocument, LeaseDocumentType
from apps.leases.permissions import IsLandlordAgentOrAdmin, IsLeaseLandlord
from apps.leases.serializers import (
    CreateLeaseFromApplicationSerializer,
    LeaseAddendumCreateSerializer,
    LeaseAddendumSerializer,
    LeaseDetailSerializer,
    LeaseDocumentSerializer,
    LeaseDocumentUploadSerializer,
    LeaseListSerializer,
    LeaseSignSerializer,
    LeaseTerminateSerializer,
)
from apps.leases.services.pdf import ensure_lease_agreement_document, ensure_signed_lease_pdf
from apps.leases.services.workflow import (
    LeaseWorkflowError,
    create_lease_from_application,
    refresh_lease_status,
    sign_lease,
    terminate_lease,
    upload_lease_document,
)
from core.pagination import StandardResultsSetPagination


class LandlordLeaseListView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Landlord Leases"],
        summary="List leases for landlord properties",
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("property_id", str),
        ],
    )
    def get(self, request):
        qs = (
            Lease.objects.filter(landlord=request.user)
            .select_related("property", "tenant", "tenant__profile", "landlord__profile")
            .order_by("-created_at")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        property_id = request.query_params.get("property_id")
        if property_id:
            qs = qs.filter(property_id=property_id)

        for lease in qs:
            refresh_lease_status(lease)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = LeaseListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class LandlordLeaseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    def get_object(self, request, pk):
        return (
            Lease.objects.filter(landlord=request.user)
            .select_related("property", "tenant", "tenant__profile", "landlord__profile", "application")
            .prefetch_related("documents", "addendums", "signatures", "signatures__signer__profile")
            .get(pk=pk)
        )

    @extend_schema(tags=["Landlord Leases"], summary="Get lease detail")
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


class LandlordCreateLeaseFromApplicationView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]

    @extend_schema(
        tags=["Landlord Leases"],
        summary="Create lease from approved application",
        request=CreateLeaseFromApplicationSerializer,
    )
    def post(self, request, application_id):
        application = RentalApplication.objects.select_related("property", "tenant").get(
            pk=application_id,
            property__owner=request.user,
        )
        serializer = CreateLeaseFromApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            lease = create_lease_from_application(
                application,
                actor=request.user,
                duration_months=serializer.validated_data.get("duration_months", 12),
                rent_due_day=serializer.validated_data.get("rent_due_day", 1),
                deposit_amount=serializer.validated_data.get("deposit_amount"),
                notes=serializer.validated_data.get("notes", ""),
            )
        except LeaseWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Lease created from approved application.",
                "data": LeaseDetailSerializer(lease, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordLeaseSignView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    @extend_schema(tags=["Landlord Leases"], summary="Sign lease as landlord", request=LeaseSignSerializer)
    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk, landlord=request.user)
        serializer = LeaseSignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["role"] != "LANDLORD":
            return Response(
                {"success": False, "error": {"message": "Landlords must sign with role LANDLORD."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            sign_lease(lease, request.user, role="LANDLORD", request=request)
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


class LandlordLeaseTerminateView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    @extend_schema(
        tags=["Landlord Leases"],
        summary="Terminate an active lease",
        request=LeaseTerminateSerializer,
    )
    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk, landlord=request.user)
        serializer = LeaseTerminateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            terminate_lease(lease, request.user, reason=serializer.validated_data.get("reason", ""))
        except LeaseWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Lease terminated.",
                "data": {"id": str(lease.id), "status": lease.status},
            }
        )


class LandlordLeaseDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    @extend_schema(
        tags=["Landlord Leases"],
        summary="Upload lease document (PDF)",
        request=LeaseDocumentUploadSerializer,
    )
    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk, landlord=request.user)
        serializer = LeaseDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc = upload_lease_document(
            lease,
            request.user,
            doc_type=serializer.validated_data["doc_type"],
            title=serializer.validated_data["title"],
            file=serializer.validated_data["file"],
            is_shareable=serializer.validated_data.get("is_shareable", True),
        )
        return Response(
            {
                "success": True,
                "message": "Document uploaded.",
                "data": LeaseDocumentSerializer(doc, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordLeaseAddendumView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    @extend_schema(
        tags=["Landlord Leases"],
        summary="Add lease addendum with document",
        request=LeaseAddendumCreateSerializer,
    )
    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk, landlord=request.user)
        serializer = LeaseAddendumCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doc = upload_lease_document(
            lease,
            request.user,
            doc_type=LeaseDocumentType.ADDENDUM,
            title=serializer.validated_data["title"],
            file=serializer.validated_data["file"],
        )
        addendum = LeaseAddendum.objects.create(
            lease=lease,
            title=serializer.validated_data["title"],
            description=serializer.validated_data.get("description", ""),
            effective_date=serializer.validated_data["effective_date"],
            document=doc,
            created_by=request.user,
        )
        return Response(
            {
                "success": True,
                "message": "Addendum created.",
                "data": LeaseAddendumSerializer(addendum, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordLeaseDocumentShareView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin, IsLeaseLandlord]

    @extend_schema(tags=["Landlord Leases"], summary="Get document download/share URL")
    def get(self, request, pk, doc_id):
        lease = Lease.objects.get(pk=pk, landlord=request.user)
        doc = LeaseDocument.objects.get(pk=doc_id, lease=lease)
        return Response(
            {
                "success": True,
                "data": LeaseDocumentSerializer(doc, context={"request": request}).data,
            }
        )
