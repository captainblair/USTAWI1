from rest_framework.permissions import BasePermission

from apps.applications.models import RentalApplication


class IsTenantUser(BasePermission):
    message = "Tenant access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TENANT"
        )


class IsApplicationTenant(BasePermission):
    message = "You can only access your own applications."

    def has_object_permission(self, request, view, obj: RentalApplication):
        return obj.tenant_id == request.user.id


class IsApplicationLandlord(BasePermission):
    message = "You can only manage applications for your properties."

    def has_object_permission(self, request, view, obj: RentalApplication):
        if request.user.is_superuser or request.user.role == "ADMIN":
            return True
        return obj.property.owner_id == request.user.id


class IsLandlordAgentOrAdmin(BasePermission):
    message = "Landlord or agent access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("LANDLORD", "AGENT", "ADMIN") or request.user.is_superuser
