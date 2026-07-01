from django.db import models
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.accounts.serializers import (
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    AdminUserRoleUpdateSerializer,
)
from core.pagination import StandardResultsSetPagination
from core.permissions import IsAdmin


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Admin Users"],
        summary="List platform users",
        parameters=[
            OpenApiParameter("role", str, description="Filter by role"),
            OpenApiParameter("search", str, description="Search email or name"),
        ],
    )
    def get(self, request):
        qs = User.objects.select_related("profile").order_by("-created_at")

        role = request.query_params.get("role", "").strip().upper()
        if role:
            qs = qs.filter(role=role)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                models.Q(email__icontains=search)
                | models.Q(profile__full_name__icontains=search)
                | models.Q(phone__icontains=search)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminUserListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, pk):
        return User.objects.select_related("profile").get(pk=pk)

    @extend_schema(tags=["Admin Users"], summary="Get user details")
    def get(self, request, pk):
        try:
            user = self.get_object(pk)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": {"message": "User not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = AdminUserDetailSerializer(user, context={"request": request})
        return Response({"success": True, "data": serializer.data})

    @extend_schema(tags=["Admin Users"], summary="Update user role")
    def patch(self, request, pk):
        try:
            user = self.get_object(pk)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": {"message": "User not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminUserRoleUpdateSerializer(
            data=request.data,
            context={"request": request, "target_user": user},
        )
        serializer.is_valid(raise_exception=True)

        new_role = serializer.validated_data["role"]
        user.role = new_role
        update_fields = ["role", "updated_at"]

        if new_role == UserRole.ADMIN:
            user.is_staff = True
            update_fields.append("is_staff")
        elif user.is_staff and not user.is_superuser:
            user.is_staff = False
            update_fields.append("is_staff")

        user.save(update_fields=update_fields)
        detail = AdminUserDetailSerializer(user, context={"request": request})
        return Response({"success": True, "data": detail.data})
