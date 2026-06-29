import django_filters
from django.db.models import Q

from apps.applications.models import ApplicationStatus, RentalApplication


class TenantApplicationFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")

    class Meta:
        model = RentalApplication
        fields = ["status"]


class LandlordApplicationFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")
    property_id = django_filters.UUIDFilter(field_name="property_id")
    min_score = django_filters.NumberFilter(field_name="screening_score", lookup_expr="gte")

    class Meta:
        model = RentalApplication
        fields = ["status", "property_id"]

    @property
    def qs(self):
        qs = super().qs
        q = self.data.get("q")
        if q:
            qs = qs.filter(
                Q(tenant__profile__full_name__icontains=q)
                | Q(tenant__email__icontains=q)
                | Q(property__title__icontains=q)
            )
        return qs


def sort_landlord_applications(qs, sort_param: str):
    mapping = {
        "score": "-screening_score",
        "-score": "screening_score",
        "date": "-submitted_at",
        "-date": "submitted_at",
        "newest": "-created_at",
        "oldest": "created_at",
    }
    return qs.order_by(mapping.get(sort_param, "-screening_score"))


def exclude_draft_for_landlord(qs):
    return qs.exclude(status=ApplicationStatus.DRAFT)
