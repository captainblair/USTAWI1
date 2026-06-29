from rest_framework.permissions import BasePermission

from apps.maintenance.models import MaintenanceRequest


class IsTenantUser(BasePermission):
    message = "Tenant access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TENANT"
        )


class IsLandlordAgentOrAdmin(BasePermission):
    message = "Landlord or agent access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("LANDLORD", "AGENT", "ADMIN") or request.user.is_superuser


class IsMaintenanceTenant(BasePermission):
    message = "You can only access your own maintenance requests."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        pk = view.kwargs.get("pk")
        if not pk:
            return True
        return MaintenanceRequest.objects.filter(pk=pk, tenant=request.user).exists()


class IsMaintenanceLandlord(BasePermission):
    message = "You can only manage maintenance for your properties."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.role == "ADMIN":
            return True
        pk = view.kwargs.get("pk")
        if not pk:
            return True
        return MaintenanceRequest.objects.filter(pk=pk, landlord=request.user).exists()
