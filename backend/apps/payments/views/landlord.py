from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import LandlordSubscription, Payment, PayoutMethod, SubscriptionPlan
from apps.payments.permissions import IsLandlordAgentOrAdmin
from apps.payments.serializers import (
    LandlordIncomeSummarySerializer,
    LandlordPaymentSerializer,
    LandlordSubscriptionSerializer,
    PayoutMethodCreateSerializer,
    PayoutMethodSerializer,
)
from apps.payments.services.analytics import get_landlord_monthly_summary
from core.pagination import StandardResultsSetPagination


class LandlordCollectedPaymentsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Landlord Payments"],
        summary="View collected rent payments",
        parameters=[OpenApiParameter("property_id", str)],
    )
    def get(self, request):
        qs = (
            Payment.objects.filter(landlord=request.user)
            .select_related("tenant", "tenant__profile", "invoice", "invoice__lease__property")
            .order_by("-completed_at", "-created_at")
        )
        property_id = request.query_params.get("property_id")
        if property_id:
            qs = qs.filter(invoice__lease__property_id=property_id)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = LandlordPaymentSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class LandlordIncomeSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]

    @extend_schema(
        tags=["Landlord Payments"],
        summary="Monthly income summary",
        parameters=[OpenApiParameter("month", str, description="YYYY-MM")],
    )
    def get(self, request):
        month_str = request.query_params.get("month")
        if month_str:
            year, month = map(int, month_str.split("-"))
        else:
            from django.utils import timezone

            today = timezone.now().date()
            year, month = today.year, today.month

        summary = get_landlord_monthly_summary(request.user, year, month)
        return Response(
            {
                "success": True,
                "data": LandlordIncomeSummarySerializer(summary).data,
            }
        )


class LandlordPayoutMethodListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Payments"], summary="List payout methods")
    def get(self, request):
        methods = PayoutMethod.objects.filter(landlord=request.user)
        return Response(
            {
                "success": True,
                "data": PayoutMethodSerializer(methods, many=True).data,
            }
        )

    @extend_schema(
        tags=["Landlord Payments"],
        summary="Add payout method",
        request=PayoutMethodCreateSerializer,
    )
    def post(self, request):
        serializer = PayoutMethodCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_default"):
            PayoutMethod.objects.filter(landlord=request.user, is_default=True).update(is_default=False)
        method = PayoutMethod.objects.create(landlord=request.user, **serializer.validated_data)
        return Response(
            {
                "success": True,
                "message": "Payout method added.",
                "data": PayoutMethodSerializer(method).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Payments"], summary="Get landlord subscription (stub)")
    def get(self, request):
        subscription, _ = LandlordSubscription.objects.get_or_create(
            landlord=request.user,
            defaults={"plan": SubscriptionPlan.FREE, "monthly_fee": 0},
        )
        return Response(
            {
                "success": True,
                "data": LandlordSubscriptionSerializer(subscription).data,
            }
        )
