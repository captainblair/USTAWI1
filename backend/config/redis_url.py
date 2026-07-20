"""Normalize Redis URLs for Celery / redis-py TLS clients."""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# Celery Redis backend refuses rediss:// unless ssl_cert_reqs is explicit.
_DEFAULT_SSL_CERT_REQS = "CERT_REQUIRED"


def ensure_redis_ssl_cert_reqs(url: str, cert_reqs: str = _DEFAULT_SSL_CERT_REQS) -> str:
    """
    Append ssl_cert_reqs to rediss:// URLs when missing.

    Celery raises ValueError on rediss:// without this query param
    (broker and result backend). Plain redis:// URLs are returned unchanged.
    """
    if not url or not url.startswith("rediss://"):
        return url

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "ssl_cert_reqs" in query:
        return url

    query["ssl_cert_reqs"] = cert_reqs
    return urlunparse(parsed._replace(query=urlencode(query)))
