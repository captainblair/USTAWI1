from rest_framework.permissions import BasePermission


class IsTenant(BasePermission):
    message = "Tenant access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TENANT"
        )


class IsLandlord(BasePermission):
    message = "Landlord access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("LANDLORD", "AGENT")
        )


class IsAgent(BasePermission):
    message = "Agent access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "AGENT"
        )


class IsInspector(BasePermission):
    message = "Inspector access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "INSPECTOR"
        )


class IsAdmin(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == "ADMIN" or request.user.is_superuser)
        )


class IsLandlordOrAdmin(BasePermission):
    message = "Landlord or admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("LANDLORD", "AGENT", "ADMIN") or request.user.is_superuser
