from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.services.admin_dashboard import get_admin_dashboard
from apps.analytics.services.landlord_dashboard import get_landlord_dashboard
from apps.analytics.services.recommendations import get_property_recommendations
from apps.analytics.services.tenant_dashboard import get_tenant_dashboard
from apps.analytics.services.timeseries import (
    application_status_chart,
    occupancy_donut,
    revenue_timeseries,
    user_growth_timeseries,
)
from apps.applications.models import RentalApplication
from apps.properties.models import Property, PropertyStatus
from core.permissions import IsAdmin, IsLandlordOrAdmin, IsTenant


class TenantDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsTenant]

    @extend_schema(tags=["Analytics"], summary="Tenant dashboard KPIs and charts")
    def get(self, request):
        return Response(
            {
                "success": True,
                "data": get_tenant_dashboard(request.user, request=request),
            }
        )


class TenantRecommendationsView(APIView):
    permission_classes = [IsAuthenticated, IsTenant]

    @extend_schema(
        tags=["Analytics"],
        summary="Property recommendations for tenant",
        parameters=[OpenApiParameter("limit", int)],
    )
    def get(self, request):
        limit = int(request.query_params.get("limit", 6))
        return Response(
            {
                "success": True,
                "data": get_property_recommendations(request.user, limit=limit, request=request),
            }
        )


class LandlordDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordOrAdmin]

    @extend_schema(tags=["Analytics"], summary="Landlord dashboard KPIs and charts")
    def get(self, request):
        return Response(
            {
                "success": True,
                "data": get_landlord_dashboard(request.user, request=request),
            }
        )


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(tags=["Analytics"], summary="Admin platform dashboard KPIs and charts")
    def get(self, request):
        return Response(
            {
                "success": True,
                "data": get_admin_dashboard(request=request),
            }
        )


class ChartRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Analytics"],
        summary="Revenue time-series chart data",
        parameters=[OpenApiParameter("months", int, description="Number of months (default 6)")],
    )
    def get(self, request):
        months = int(request.query_params.get("months", 6))
        landlord = None
        if request.user.role in ("LANDLORD", "AGENT") and not request.user.is_superuser:
            landlord = request.user
        elif request.user.role not in ("ADMIN",) and not request.user.is_superuser:
            return Response(
                {"success": False, "error": {"message": "Not authorized for revenue chart."}},
                status=403,
            )
        return Response(
            {
                "success": True,
                "data": revenue_timeseries(landlord=landlord, months=months),
            }
        )


class ChartApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Analytics"],
        summary="Applications by status chart (donut)",
    )
    def get(self, request):
        if request.user.role == "TENANT":
            qs = RentalApplication.objects.filter(tenant=request.user)
        elif request.user.role in ("LANDLORD", "AGENT"):
            qs = RentalApplication.objects.filter(property__owner=request.user)
        elif request.user.role == "ADMIN" or request.user.is_superuser:
            qs = RentalApplication.objects.all()
        else:
            return Response(
                {"success": False, "error": {"message": "Not authorized."}},
                status=403,
            )
        return Response(
            {
                "success": True,
                "data": application_status_chart(qs),
            }
        )


class ChartUserGrowthView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Analytics"],
        summary="User growth time-series (admin)",
        parameters=[OpenApiParameter("months", int)],
    )
    def get(self, request):
        months = int(request.query_params.get("months", 6))
        return Response(
            {
                "success": True,
                "data": user_growth_timeseries(months=months),
            }
        )


class ChartOccupancyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Analytics"], summary="Occupancy breakdown donut chart")
    def get(self, request):
        if request.user.role in ("LANDLORD", "AGENT"):
            qs = Property.objects.filter(owner=request.user)
        elif request.user.role == "ADMIN" or request.user.is_superuser:
            qs = Property.objects.all()
        else:
            return Response(
                {"success": False, "error": {"message": "Not authorized."}},
                status=403,
            )
        active = qs.filter(status=PropertyStatus.ACTIVE).count()
        occupied = qs.filter(status=PropertyStatus.OCCUPIED).count()
        total = qs.count()
        return Response(
            {
                "success": True,
                "data": occupancy_donut(
                    occupied=occupied,
                    vacant=active,
                    other=total - active - occupied,
                ),
            }
        )
