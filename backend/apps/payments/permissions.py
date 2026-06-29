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
    message = "You can only pay rent for your own leases."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        lease_id = view.kwargs.get("lease_id") or request.data.get("lease_id")
        if not lease_id:
            return True
        return Lease.objects.filter(pk=lease_id, tenant=request.user).exists()
