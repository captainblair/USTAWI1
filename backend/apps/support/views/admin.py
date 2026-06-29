from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.support.models import SupportCase, SupportCaseStatus
from apps.support.serializers import (
    AdminCaseEscalateSerializer,
    AdminCaseUpdateSerializer,
    CaseMessageCreateSerializer,
    CaseMessageSerializer,
    SupportCaseDetailSerializer,
    SupportCaseListSerializer,
)
from apps.support.services.workflow import (
    SupportWorkflowError,
    add_case_message,
    update_case_status,
)
from core.pagination import StandardResultsSetPagination
from core.permissions import IsAdmin


class AdminSupportCaseListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Admin Support"],
        summary="List all support cases",
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("category", str),
            OpenApiParameter("urgency", int),
        ],
    )
    def get(self, request):
        qs = (
            SupportCase.objects.select_related("reporter", "reporter__profile", "assigned_admin")
            .prefetch_related("attachments", "messages")
            .order_by("-urgency", "-created_at")
        )
        for param in ("status", "category"):
            value = request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        urgency = request.query_params.get("urgency")
        if urgency:
            qs = qs.filter(urgency=urgency)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = SupportCaseListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class AdminSupportCaseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(tags=["Admin Support"], summary="Admin support case detail")
    def get(self, request, pk):
        case = (
            SupportCase.objects.select_related(
                "reporter", "reporter__profile", "assigned_admin", "property", "lease"
            )
            .prefetch_related("attachments", "messages", "messages__sender")
            .get(pk=pk)
        )
        return Response(
            {
                "success": True,
                "data": SupportCaseDetailSerializer(case, context={"request": request}).data,
            }
        )


class AdminSupportCaseUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Admin Support"],
        summary="Update case status / resolve",
        request=AdminCaseUpdateSerializer,
    )
    def patch(self, request, pk):
        case = SupportCase.objects.get(pk=pk)
        serializer = AdminCaseUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update_case_status(
            case,
            request.user,
            new_status=serializer.validated_data["status"],
            resolution_notes=serializer.validated_data.get("resolution_notes", ""),
            assign_admin=request.user,
        )
        return Response(
            {
                "success": True,
                "message": "Case updated.",
                "data": {"id": str(case.id), "status": case.status},
            }
        )


class AdminSupportCaseEscalateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Admin Support"],
        summary="Escalate support case",
        request=AdminCaseEscalateSerializer,
    )
    def post(self, request, pk):
        case = SupportCase.objects.get(pk=pk)
        serializer = AdminCaseEscalateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            update_case_status(
                case,
                request.user,
                new_status=SupportCaseStatus.ESCALATED,
                assign_admin=request.user,
            )
            if serializer.validated_data.get("note"):
                add_case_message(
                    case,
                    request.user,
                    serializer.validated_data["note"],
                    is_internal=True,
                )
        except SupportWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Case escalated.",
                "data": {"id": str(case.id), "status": case.status},
            }
        )


class AdminSupportCaseMessageView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Admin Support"],
        summary="Admin reply or internal note",
        request=CaseMessageCreateSerializer,
    )
    def post(self, request, pk):
        case = SupportCase.objects.get(pk=pk)
        serializer = CaseMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_internal = request.data.get("is_internal", False)
        msg = add_case_message(
            case,
            request.user,
            serializer.validated_data["body"],
            is_internal=bool(is_internal),
        )
        if case.status == SupportCaseStatus.OPEN:
            update_case_status(case, request.user, SupportCaseStatus.UNDER_REVIEW, assign_admin=request.user)
        return Response(
            {
                "success": True,
                "message": "Message added.",
                "data": CaseMessageSerializer(msg, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
