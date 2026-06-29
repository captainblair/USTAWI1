import math

from django.conf import settings
from django.db.models import QuerySet


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def filter_by_radius(qs: QuerySet, lat: float, lng: float, radius_km: float) -> QuerySet:
    if settings.USE_POSTGIS:
        return qs.extra(
            where=[
                "ST_DWithin("
                "ST_SetSRID(ST_MakePoint(CAST(longitude AS double precision), "
                "CAST(latitude AS double precision)), 4326)::geography, "
                "ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, "
                "%s)"
            ],
            params=[lng, lat, radius_km * 1000],
        )

    matching_ids = [
        obj.pk
        for obj in qs.only("id", "latitude", "longitude")
        if haversine_km(lat, lng, float(obj.latitude), float(obj.longitude)) <= radius_km
    ]
    return qs.filter(pk__in=matching_ids)


def filter_by_bbox(
    qs: QuerySet,
    min_lng: float,
    min_lat: float,
    max_lng: float,
    max_lat: float,
) -> QuerySet:
    if settings.USE_POSTGIS:
        return qs.extra(
            where=[
                "CAST(latitude AS double precision) >= %s AND "
                "CAST(latitude AS double precision) <= %s AND "
                "CAST(longitude AS double precision) >= %s AND "
                "CAST(longitude AS double precision) <= %s"
            ],
            params=[min_lat, max_lat, min_lng, max_lng],
        )

    return qs.filter(
        latitude__gte=min_lat,
        latitude__lte=max_lat,
        longitude__gte=min_lng,
        longitude__lte=max_lng,
    )
