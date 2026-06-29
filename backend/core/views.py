from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Health"],
        summary="Health check",
        description="Returns service health status including database connectivity.",
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

        payload = {
            "success": True,
            "status": "healthy" if db_ok else "degraded",
            "service": "ustawi-api",
            "database": "connected" if db_ok else "disconnected",
        }
        if db_error and request.query_params.get("debug") == "1":
            payload["database_error"] = db_error

        http_status = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=http_status)
