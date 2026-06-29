from rest_framework.permissions import BasePermission

from apps.leases.models import Lease


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


class IsLeaseTenant(BasePermission):
    message = "You can only access your own leases."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        pk = view.kwargs.get("pk")
        if not pk:
            return True
        return Lease.objects.filter(pk=pk, tenant=request.user).exists()


class IsLeaseLandlord(BasePermission):
    message = "You can only manage leases for your properties."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.role == "ADMIN":
            return True
        pk = view.kwargs.get("pk")
        if not pk:
            return True
        return Lease.objects.filter(pk=pk, landlord=request.user).exists()
