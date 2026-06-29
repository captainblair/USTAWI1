from rest_framework.permissions import BasePermission


class IsInspectorOrAdmin(BasePermission):
    message = "Inspector or admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("INSPECTOR", "ADMIN") or request.user.is_superuser


class IsAdminUser(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == "ADMIN" or request.user.is_superuser
