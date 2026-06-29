from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.support.models import CaseAttachment, SupportCase
from apps.support.serializers import (
    CaseAttachmentSerializer,
    CaseMessageCreateSerializer,
    SupportCaseCreateSerializer,
    SupportCaseDetailSerializer,
    SupportCaseListSerializer,
)
from apps.support.services.workflow import (
    SupportWorkflowError,
    add_case_message,
    create_support_case,
    validate_attachments,
)
from core.pagination import StandardResultsSetPagination


class SupportCaseListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        tags=["Support"],
        summary="List my support cases",
        parameters=[OpenApiParameter("status", str)],
    )
    def get(self, request):
        qs = (
            SupportCase.objects.filter(reporter=request.user)
            .prefetch_related("attachments", "messages")
            .order_by("-created_at")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = SupportCaseListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Support"],
        summary="Raise a dispute / support case with attachments",
        request=SupportCaseCreateSerializer,
    )
    def post(self, request):
        data = {
            "category": request.data.get("category"),
            "urgency": request.data.get("urgency", 3),
            "subject": request.data.get("subject"),
            "description": request.data.get("description"),
            "property_id": request.data.get("property_id") or None,
            "lease_id": request.data.get("lease_id") or None,
        }
        serializer = SupportCaseCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        files = request.FILES.getlist("attachments") or request.FILES.getlist("files") or []
        try:
            case = create_support_case(
                request.user,
                serializer.validated_data,
                files=files or None,
            )
        except SupportWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        case = SupportCase.objects.prefetch_related("attachments", "messages").get(pk=case.pk)
        return Response(
            {
                "success": True,
                "message": "Support case submitted.",
                "data": SupportCaseDetailSerializer(case, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SupportCaseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Support"], summary="Get support case detail")
    def get(self, request, pk):
        case = (
            SupportCase.objects.filter(reporter=request.user)
            .select_related("property", "lease", "assigned_admin", "assigned_admin__profile")
            .prefetch_related("attachments", "messages", "messages__sender", "messages__sender__profile")
            .get(pk=pk)
        )
        return Response(
            {
                "success": True,
                "data": SupportCaseDetailSerializer(case, context={"request": request}).data,
            }
        )


class SupportCaseMessageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Support"],
        summary="Add message to support case",
        request=CaseMessageCreateSerializer,
    )
    def post(self, request, pk):
        case = SupportCase.objects.get(pk=pk, reporter=request.user)
        serializer = CaseMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            msg = add_case_message(case, request.user, serializer.validated_data["body"])
        except SupportWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.support.serializers import CaseMessageSerializer

        return Response(
            {
                "success": True,
                "message": "Message added.",
                "data": CaseMessageSerializer(msg, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SupportCaseAttachmentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["Support"], summary="Add attachment to open case")
    def post(self, request, pk):
        case = SupportCase.objects.get(pk=pk, reporter=request.user)
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"success": False, "error": {"message": "File is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.support.serializers import validate_attachment_size

        try:
            validate_attachment_size(file)
            validate_attachments(case, 1)
        except SupportWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachment = CaseAttachment.objects.create(
            case=case,
            file=file,
            filename=file.name,
            uploaded_by=request.user,
        )
        return Response(
            {
                "success": True,
                "message": "Attachment uploaded.",
                "data": CaseAttachmentSerializer(attachment, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
