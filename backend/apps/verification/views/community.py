from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import Property, PropertyStatus
from apps.verification.models import CommunityReport, CommunityReportStatus
from apps.verification.serializers import CommunityReportCreateSerializer, CommunityReportSerializer
from core.pagination import StandardResultsSetPagination


class PropertyCommunityReportListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = StandardResultsSetPagination

    @extend_schema(tags=["Community Reports"], summary="List public community reports for a property")
    def get(self, request, property_id):
        qs = CommunityReport.objects.filter(
            property_id=property_id,
            is_public=True,
            status=CommunityReportStatus.VERIFIED,
        ).select_related("reporter", "reporter__profile").order_by("-created_at")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = CommunityReportSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class CommunityReportCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Community Reports"], summary="Submit a community report")
    def post(self, request):
        serializer = CommunityReportCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        prop = Property.objects.get(pk=serializer.validated_data["property_id"])
        if prop.status != PropertyStatus.ACTIVE:
            return Response(
                {"success": False, "error": {"message": "Reports can only be filed on active listings."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Report submitted for review.",
                "data": CommunityReportSerializer(report, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
