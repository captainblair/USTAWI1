from django.core.cache import cache
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    @extend_schema(
        tags=["Health"],
        summary="Health check",
        description="Returns service health status including database, cache, and Celery broker connectivity.",
    )
    def get(self, request):
        db_ok = True
        db_error = None
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as exc:
            db_ok = False
            db_error = str(exc)

        cache_ok = True
        cache_error = None
        try:
            cache.set("health:ping", "pong", 10)
            cache_ok = cache.get("health:ping") == "pong"
        except Exception as exc:
            cache_ok = False
            cache_error = str(exc)

        checks_ok = db_ok and cache_ok
        payload = {
            "success": True,
            "status": "healthy" if checks_ok else "degraded",
            "service": "ustawi-api",
            "database": "connected" if db_ok else "disconnected",
            "cache": "connected" if cache_ok else "disconnected",
        }
        if request.query_params.get("debug") == "1":
            if db_error:
                payload["database_error"] = db_error
            if cache_error:
                payload["cache_error"] = cache_error

        http_status = status.HTTP_200_OK if checks_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=http_status)
