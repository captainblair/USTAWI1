from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import NotificationPreference
from apps.accounts.serializers import (
    LoginActivitySerializer,
    NotificationPreferenceSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(tags=["Profile"], summary="Get current user profile")
    def get(self, request):
        return Response(
            {"success": True, "data": UserProfileSerializer(request.user.profile, context={"request": request}).data},
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Profile"], summary="Update current user profile")
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user.profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Profile updated.",
                "data": UserProfileSerializer(request.user.profile, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Profile"], summary="Get notification preferences")
    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response(
            {"success": True, "data": NotificationPreferenceSerializer(prefs).data},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Profile"],
        summary="Update notification preferences",
        request=NotificationPreferenceSerializer,
    )
    def patch(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Notification preferences updated.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class LoginActivityListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Profile"], summary="List login activity history")
    def get(self, request):
        activities = request.user.login_activities.all()[:20]
        return Response(
            {
                "success": True,
                "data": LoginActivitySerializer(activities, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
