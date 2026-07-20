"""Normalize Redis URLs for Celery TLS clients.

Celery expects ssl_cert_reqs=CERT_REQUIRED|CERT_OPTIONAL|CERT_NONE.
Django's redis-py cache client does not — leave REDIS_URL untouched.
"""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

_DEFAULT_SSL_CERT_REQS = "CERT_REQUIRED"


def ensure_redis_ssl_cert_reqs(url: str, cert_reqs: str = _DEFAULT_SSL_CERT_REQS) -> str:
    """
    Append Celery-style ssl_cert_reqs to rediss:// URLs when missing.

    Use only for CELERY_BROKER_URL / CELERY_RESULT_BACKEND.
    Plain redis:// URLs are returned unchanged.
    """
    if not url or not url.startswith("rediss://"):
        return url

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "ssl_cert_reqs" in query:
        return url

    query["ssl_cert_reqs"] = cert_reqs
    return urlunparse(parsed._replace(query=urlencode(query)))
