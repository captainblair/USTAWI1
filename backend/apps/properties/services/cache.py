import hashlib
import json

from django.core.cache import cache
from django.core.serializers.json import DjangoJSONEncoder

CACHE_TIMEOUT_SEARCH = 60 * 5
CACHE_TIMEOUT_FEATURED = 60 * 10
CACHE_TIMEOUT_FILTERS = 60 * 30


def _cache_version() -> int:
    return cache.get("properties:cache_version", 0)


def bump_property_cache_version():
    try:
        cache.incr("properties:cache_version")
    except ValueError:
        cache.set("properties:cache_version", 1, None)


def _cache_key(prefix: str, params: dict) -> str:
    params = {**params, "v": _cache_version()}
    raw = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.md5(raw.encode()).hexdigest()
    return f"properties:{prefix}:{digest}"


def get_cached_response(prefix: str, params: dict):
    return cache.get(_cache_key(prefix, params))


def set_cached_response(prefix: str, params: dict, data, timeout: int):
    cache.set(_cache_key(prefix, params), data, timeout)


def serialize_for_cache(data):
    return json.loads(json.dumps(data, cls=DjangoJSONEncoder))
