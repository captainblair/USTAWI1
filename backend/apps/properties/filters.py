import django_filters
from django.db.models import Max, Min, Q

from apps.properties.models import Amenity, Neighborhood, Property, PropertyStatus, PropertyType


class PropertyFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method="filter_keyword")
    city = django_filters.CharFilter(field_name="city", lookup_expr="iexact")
    neighborhood = django_filters.CharFilter(field_name="neighborhood__slug")
    min_price = django_filters.NumberFilter(field_name="price_monthly", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_monthly", lookup_expr="lte")
    min_beds = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="gte")
    max_beds = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="lte")
    min_baths = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="gte")
    property_type = django_filters.CharFilter(field_name="property_type")
    min_safety_score = django_filters.NumberFilter(field_name="safety_score", lookup_expr="gte")
    is_featured = django_filters.BooleanFilter(field_name="is_featured")
    amenities = django_filters.CharFilter(method="filter_amenities")

    class Meta:
        model = Property
        fields = []

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(address__icontains=value)
            | Q(neighborhood__name__icontains=value)
            | Q(city__icontains=value)
        )

    def filter_amenities(self, queryset, name, value):
        slugs = [s.strip() for s in value.split(",") if s.strip()]
        for slug in slugs:
            queryset = queryset.filter(amenities__slug=slug)
        return queryset.distinct()


def get_public_queryset():
    return (
        Property.objects.filter(status=PropertyStatus.ACTIVE)
        .select_related("owner", "owner__profile", "neighborhood")
        .prefetch_related("images", "amenities")
    )


def build_filter_metadata():
    active = Property.objects.filter(status=PropertyStatus.ACTIVE)
    price = active.aggregate(min_price=Min("price_monthly"), max_price=Max("price_monthly"))
    safety = active.aggregate(min_score=Min("safety_score"), max_score=Max("safety_score"))

    return {
        "cities": list(active.values_list("city", flat=True).distinct().order_by("city")),
        "neighborhoods": list(
            Neighborhood.objects.filter(properties__status=PropertyStatus.ACTIVE)
            .distinct()
            .values("name", "slug", "city")
            .order_by("name")
        ),
        "property_types": [{"value": c[0], "label": c[1]} for c in PropertyType.choices],
        "amenities": list(Amenity.objects.values("name", "slug", "icon").order_by("name")),
        "price_range": {
            "min": float(price["min_price"]) if price["min_price"] else 0,
            "max": float(price["max_price"]) if price["max_price"] else 0,
        },
        "safety_score_range": {
            "min": float(safety["min_score"]) if safety["min_score"] else 0,
            "max": float(safety["max_score"]) if safety["max_score"] else 10,
        },
        "suggestions_when_empty": [
            "Adjust price range",
            "Lower safety score filter",
            "Clear some amenities",
            "Explore nearby areas",
        ],
    }
