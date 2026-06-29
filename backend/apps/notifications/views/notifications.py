from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import ActivityEvent, Notification
from apps.notifications.serializers import (
    ActivityEventSerializer,
    NotificationBadgeSerializer,
    NotificationSerializer,
)
from apps.notifications.services.dispatch import (
    get_badge_counts,
    mark_all_read,
    mark_notification_read,
)
from core.pagination import StandardResultsSetPagination


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Notifications"],
        summary="List notifications",
        parameters=[
            OpenApiParameter("category", str, description="APPLICATIONS | PAYMENTS | MAINTENANCE | SYSTEM"),
            OpenApiParameter("unread", bool, description="Filter unread only"),
        ],
    )
    def get(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        if request.query_params.get("unread", "").lower() in ("true", "1"):
            qs = qs.filter(is_read=False)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data["badge"] = get_badge_counts(request.user)
        return response


class NotificationBadgeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Notifications"], summary="Unread notification badge counts")
    def get(self, request):
        return Response(
            {
                "success": True,
                "data": NotificationBadgeSerializer(get_badge_counts(request.user)).data,
            }
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Notifications"], summary="Mark notification as read")
    def post(self, request, pk):
        notification = Notification.objects.get(pk=pk, user=request.user)
        mark_notification_read(notification)
        return Response(
            {
                "success": True,
                "message": "Notification marked as read.",
                "data": NotificationSerializer(notification).data,
            }
        )


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Notifications"], summary="Mark all notifications as read")
    def post(self, request):
        count = mark_all_read(request.user)
        return Response(
            {
                "success": True,
                "message": f"{count} notification(s) marked as read.",
                "data": {"marked_count": count},
            }
        )


class ActivityFeedView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Notifications"],
        summary="Recent activity feed for dashboard",
        parameters=[
            OpenApiParameter("category", str),
            OpenApiParameter("limit", int, description="Max items (default paginated)"),
        ],
    )
    def get(self, request):
        qs = ActivityEvent.objects.filter(user=request.user).order_by("-created_at")
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ActivityEventSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
