from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.properties.models import Property


class IsPropertyOwnerOrAdmin(BasePermission):
    message = "You can only manage your own properties."

    def has_object_permission(self, request, view, obj: Property):
        if request.user.is_superuser or request.user.role == "ADMIN":
            return True
        return obj.owner_id == request.user.id


class IsLandlordAgentOrAdmin(BasePermission):
    message = "Landlord or agent access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("LANDLORD", "AGENT", "ADMIN") or request.user.is_superuser


class IsAuthenticatedTenantOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == "TENANT"
