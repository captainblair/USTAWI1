from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import SavedProperty
from apps.properties.permissions import IsAuthenticatedTenantOrReadOnly
from apps.properties.serializers import SavedPropertySerializer
from core.pagination import StandardResultsSetPagination


class SavedPropertyListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAuthenticatedTenantOrReadOnly]
    pagination_class = StandardResultsSetPagination

    @extend_schema(tags=["Saved Properties"], summary="List saved homes")
    def get(self, request):
        qs = (
            SavedProperty.objects.filter(user=request.user)
            .select_related("property", "property__neighborhood")
            .prefetch_related("property__images", "property__amenities")
            .order_by("-created_at")
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = SavedPropertySerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(tags=["Saved Properties"], summary="Save a property")
    def post(self, request):
        serializer = SavedPropertySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        saved = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Property saved.",
                "data": SavedPropertySerializer(saved, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SavedPropertyDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAuthenticatedTenantOrReadOnly]

    @extend_schema(tags=["Saved Properties"], summary="Remove saved property")
    def delete(self, request, property_id):
        deleted, _ = SavedProperty.objects.filter(
            user=request.user, property_id=property_id
        ).delete()
        if not deleted:
            return Response(
                {"success": False, "error": {"message": "Saved property not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"success": True, "message": "Property removed from saved list."})
