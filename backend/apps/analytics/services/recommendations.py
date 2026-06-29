from decimal import Decimal

from django.db.models import Q

from apps.applications.models import RentalApplication
from apps.leases.models import Lease, LeaseStatus
from apps.properties.filters import get_public_queryset
from apps.properties.models import PropertyStatus, SavedProperty
from apps.properties.serializers import PropertyListSerializer

PRICE_RANGE_FACTOR = Decimal("0.20")
MIN_SAFETY_SCORE = Decimal("7.0")


def _anchor_property(user):
    active_lease = (
        Lease.objects.filter(
            tenant=user,
            status__in=[LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON],
        )
        .select_related("property", "property__neighborhood")
        .first()
    )
    if active_lease:
        return active_lease.property

    last_app = (
        RentalApplication.objects.filter(tenant=user)
        .select_related("property", "property__neighborhood")
        .order_by("-updated_at")
        .first()
    )
    if last_app:
        return last_app.property

    saved = (
        SavedProperty.objects.filter(user=user)
        .select_related("property", "property__neighborhood")
        .order_by("-created_at")
        .first()
    )
    if saved:
        return saved.property

    return None


def get_property_recommendations(user, limit: int = 6, request=None) -> list:
    anchor = _anchor_property(user)
    qs = get_public_queryset().filter(is_verified=True, safety_score__gte=MIN_SAFETY_SCORE)

    if anchor:
        price = anchor.price_monthly
        delta = price * PRICE_RANGE_FACTOR
        filters = Q(price_monthly__gte=price - delta, price_monthly__lte=price + delta)
        if anchor.neighborhood_id:
            filters &= Q(neighborhood_id=anchor.neighborhood_id) | Q(city__iexact=anchor.city)
        else:
            filters &= Q(city__iexact=anchor.city)
        qs = qs.filter(filters).exclude(pk=anchor.pk)
    else:
        qs = qs.filter(city__iexact="Nairobi")

    applied_ids = RentalApplication.objects.filter(tenant=user).values_list("property_id", flat=True)
    saved_ids = SavedProperty.objects.filter(user=user).values_list("property_id", flat=True)
    qs = qs.exclude(pk__in=list(applied_ids)).exclude(pk__in=list(saved_ids))

    qs = qs.order_by("-safety_score", "-is_featured", "-views_count")[:limit]
    return PropertyListSerializer(qs, many=True, context={"request": request}).data
