from django.conf import settings
from django.db.models import Case, IntegerField, When

from apps.properties.models import Property, PropertyStatus
from apps.properties.services.cache import bump_property_cache_version

PUBLIC_LISTING_STATUSES = (PropertyStatus.ACTIVE, PropertyStatus.OCCUPIED)


def sync_featured_properties() -> list[str]:
    """
    Mark up to FEATURED_PROPERTY_LIMIT public listings as featured.

    Prefers ACTIVE listings with a primary image, then newest publish date and safety score.
    """
    limit = getattr(settings, "FEATURED_PROPERTY_LIMIT", 6)

    candidates = (
        Property.objects.filter(
            status__in=PUBLIC_LISTING_STATUSES,
            is_verified=True,
            images__is_primary=True,
        )
        .annotate(
            status_rank=Case(
                When(status=PropertyStatus.ACTIVE, then=0),
                default=1,
                output_field=IntegerField(),
            )
        )
        .order_by("status_rank", "-published_at", "-safety_score", "-created_at")
        .distinct()
    )

    featured_ids = list(candidates.values_list("id", flat=True)[:limit])

    Property.objects.filter(is_featured=True).exclude(pk__in=featured_ids).update(is_featured=False)
    if featured_ids:
        Property.objects.filter(pk__in=featured_ids).update(is_featured=True)

    bump_property_cache_version()
    return [str(pk) for pk in featured_ids]
