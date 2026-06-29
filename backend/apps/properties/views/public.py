from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.filters import PropertyFilter, build_filter_metadata, get_public_queryset
from apps.properties.models import Property, PropertyStatus
from apps.properties.serializers import PropertyDetailSerializer, PropertyListSerializer
from apps.properties.services.geo import filter_by_bbox, filter_by_radius
from core.pagination import StandardResultsSetPagination


class PropertyListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Properties"],
        summary="Search and list active properties",
        parameters=[
            OpenApiParameter("q", str, description="Keyword search"),
            OpenApiParameter("city", str),
            OpenApiParameter("neighborhood", str, description="Neighborhood slug"),
            OpenApiParameter("min_price", float),
            OpenApiParameter("max_price", float),
            OpenApiParameter("min_beds", int),
            OpenApiParameter("max_beds", int),
            OpenApiParameter("min_baths", int),
            OpenApiParameter("property_type", str),
            OpenApiParameter("min_safety_score", float),
            OpenApiParameter("amenities", str, description="Comma-separated amenity slugs"),
            OpenApiParameter("lat", float, description="Center latitude for radius search"),
            OpenApiParameter("lng", float, description="Center longitude for radius search"),
            OpenApiParameter("radius", float, description="Radius in km"),
            OpenApiParameter("bbox", str, description="min_lng,min_lat,max_lng,max_lat"),
            OpenApiParameter("ordering", str, description="price, -price, safety_score, -safety_score"),
        ],
    )
    def get(self, request):
        qs = get_public_queryset()

        # Geo filters
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = request.query_params.get("radius")
        if lat and lng and radius:
            qs = filter_by_radius(qs, float(lat), float(lng), float(radius))

        bbox = request.query_params.get("bbox")
        if bbox:
            parts = [p.strip() for p in bbox.split(",")]
            if len(parts) == 4:
                qs = filter_by_bbox(qs, float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]))

        prop_filter = PropertyFilter(request.query_params, queryset=qs)
        qs = prop_filter.qs

        ordering = request.query_params.get("ordering", "-is_featured")
        allowed = {"price", "-price", "safety_score", "-safety_score", "-created_at", "created_at"}
        if ordering in allowed:
            order_field = ordering.replace("price", "price_monthly")
            qs = qs.order_by(order_field, "-is_featured")
        else:
            qs = qs.order_by("-is_featured", "-created_at")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = PropertyListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class PropertyDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Properties"], summary="Get property detail by ID or slug")
    def get(self, request, identifier):
        qs = get_public_queryset()
        try:
            property_obj = qs.get(pk=identifier)
        except (Property.DoesNotExist, ValueError):
            property_obj = get_object_or_404(qs, slug=identifier)

        Property.objects.filter(pk=property_obj.pk).update(views_count=F("views_count") + 1)
        property_obj.refresh_from_db()

        return Response(
            {
                "success": True,
                "data": PropertyDetailSerializer(property_obj, context={"request": request}).data,
            }
        )


class FeaturedPropertyListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Properties"], summary="List featured properties")
    def get(self, request):
        qs = get_public_queryset().filter(is_featured=True).order_by("-safety_score")[:12]
        return Response(
            {
                "success": True,
                "data": PropertyListSerializer(qs, many=True, context={"request": request}).data,
            }
        )


class PropertyFilterMetadataView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Properties"],
        summary="Filter metadata for search UI and empty states",
    )
    def get(self, request):
        return Response({"success": True, "data": build_filter_metadata()})
