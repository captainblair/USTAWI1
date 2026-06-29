from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import PropertyImage
from apps.verification.models import VerificationCase, VerificationCaseStatus, VerificationDocument
from apps.verification.permissions import IsInspectorOrAdmin
from apps.verification.serializers import (
    CaseActionSerializer,
    DocumentReviewSerializer,
    PhotoReviewSerializer,
    SafetyScoreSubmitSerializer,
    VerificationCaseDetailSerializer,
    VerificationCaseListSerializer,
)
from apps.verification.services.workflow import (
    approve_case,
    reject_case,
    request_changes,
    review_document,
    save_safety_score,
    start_review,
)
from core.pagination import StandardResultsSetPagination


class InspectorQueueView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Verification"],
        summary="Inspector verification queue",
        parameters=[
            OpenApiParameter(
                "tab",
                str,
                description="pending | in_review | awaiting_docs | rejected",
            ),
        ],
    )
    def get(self, request):
        tab = request.query_params.get("tab", "pending")
        tab_map = {
            "pending": VerificationCaseStatus.PENDING,
            "in_review": VerificationCaseStatus.IN_REVIEW,
            "awaiting_docs": VerificationCaseStatus.AWAITING_DOCS,
            "rejected": VerificationCaseStatus.REJECTED,
        }
        status_filter = tab_map.get(tab, VerificationCaseStatus.PENDING)

        qs = (
            VerificationCase.objects.filter(status=status_filter)
            .select_related("property", "property__owner", "property__owner__profile", "property__neighborhood")
            .order_by("-submitted_at")
        )

        counts = {
            tab_key: VerificationCase.objects.filter(status=tab_status).count()
            for tab_key, tab_status in tab_map.items()
        }

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = VerificationCaseListSerializer(page, many=True, context={"request": request})
        response = paginator.get_paginated_response(serializer.data)
        response.data["tab_counts"] = counts
        return response


class InspectorCaseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Verification case detail")
    def get(self, request, pk):
        case = VerificationCase.objects.select_related(
            "property", "property__owner", "property__owner__profile", "property__neighborhood"
        ).prefetch_related(
            "documents", "audit_logs", "property__images", "property__safety_score_record__factors"
        ).get(pk=pk)
        return Response(
            {
                "success": True,
                "data": VerificationCaseDetailSerializer(case, context={"request": request}).data,
            }
        )


class InspectorStartReviewView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Start reviewing a case")
    def post(self, request, pk):
        case = VerificationCase.objects.get(pk=pk)
        start_review(case, request.user)
        return Response(
            {"success": True, "message": "Review started.", "data": {"status": case.status}}
        )


class InspectorSafetyScoreView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Submit safety scoring form")
    def post(self, request, pk):
        case = VerificationCase.objects.get(pk=pk)
        serializer = SafetyScoreSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        safety = save_safety_score(
            case,
            serializer.to_factor_dict(),
            actor=request.user,
            notes=serializer.validated_data.get("notes", ""),
        )
        return Response(
            {
                "success": True,
                "message": "Safety score saved.",
                "data": {"overall_score": float(safety.overall_score)},
            }
        )


class InspectorDocumentReviewView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Review a verification document")
    def patch(self, request, pk, doc_id):
        case = VerificationCase.objects.get(pk=pk)
        vdoc = VerificationDocument.objects.get(pk=doc_id, case=case)
        serializer = DocumentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review_document(
            vdoc,
            request.user,
            serializer.validated_data["status"],
            serializer.validated_data.get("notes", ""),
        )
        return Response({"success": True, "message": "Document reviewed.", "data": {"status": vdoc.status}})


class InspectorPhotoReviewView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Approve or reject a property photo")
    def patch(self, request, pk, photo_id):
        case = VerificationCase.objects.get(pk=pk)
        photo = PropertyImage.objects.get(pk=photo_id, property=case.property)
        serializer = PhotoReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photo.verification_status = serializer.validated_data["status"]
        photo.verification_notes = serializer.validated_data.get("notes", "")
        photo.save(update_fields=["verification_status", "verification_notes", "updated_at"])

        from apps.verification.services.workflow import log_audit

        log_audit(
            case,
            request.user,
            "PHOTO_REVIEWED",
            f"Photo {photo_id} marked {photo.verification_status}.",
        )
        return Response(
            {"success": True, "message": "Photo reviewed.", "data": {"status": photo.verification_status}}
        )


class InspectorApproveView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Approve property verification")
    def post(self, request, pk):
        case = VerificationCase.objects.get(pk=pk)
        serializer = CaseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approve_case(case, request.user, notes=serializer.validated_data.get("notes", ""))
        return Response(
            {
                "success": True,
                "message": "Property approved and verified.",
                "data": {
                    "case_status": case.status,
                    "property_status": case.property.status,
                    "is_verified": case.property.is_verified,
                    "safety_score": float(case.property.safety_score),
                },
            }
        )


class InspectorRejectView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Reject property verification")
    def post(self, request, pk):
        case = VerificationCase.objects.get(pk=pk)
        serializer = CaseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reject_case(case, request.user, reason=serializer.validated_data.get("reason", ""))
        return Response(
            {
                "success": True,
                "message": "Property verification rejected.",
                "data": {"case_status": case.status, "property_status": case.property.status},
            }
        )


class InspectorRequestChangesView(APIView):
    permission_classes = [IsAuthenticated, IsInspectorOrAdmin]

    @extend_schema(tags=["Verification"], summary="Request changes from landlord")
    def post(self, request, pk):
        case = VerificationCase.objects.get(pk=pk)
        serializer = CaseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_changes(case, request.user, message=serializer.validated_data.get("message", ""))
        return Response(
            {
                "success": True,
                "message": "Changes requested.",
                "data": {"case_status": case.status, "changes_requested": case.changes_requested},
            }
        )
