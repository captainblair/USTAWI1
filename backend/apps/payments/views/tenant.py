from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.leases.models import Lease
from apps.payments.models import Invoice, Payment, PaymentReceipt
from apps.payments.permissions import IsLeaseTenant, IsTenantUser
from apps.payments.serializers import (
    InitiateRentPaymentSerializer,
    InvoiceListSerializer,
    PaymentHistorySerializer,
    PaymentReceiptSerializer,
)
from apps.payments.services.invoice import get_or_create_current_invoice, get_rent_due_summary
from apps.payments.services.workflow import PaymentWorkflowError, initiate_rent_payment
from core.pagination import StandardResultsSetPagination


class TenantInvoiceListView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Payments"],
        summary="List my rent invoices",
        parameters=[OpenApiParameter("status", str)],
    )
    def get(self, request):
        qs = (
            Invoice.objects.filter(lease__tenant=request.user)
            .select_related("lease", "lease__property")
            .order_by("-due_date")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = InvoiceListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class TenantRentDueView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]

    @extend_schema(tags=["Payments"], summary="Rent due summary for active leases")
    def get(self, request):
        leases = Lease.objects.filter(tenant=request.user).select_related("property")
        data = [
            {
                "lease_id": str(lease.id),
                "property_title": lease.property.title,
                "rent_due": get_rent_due_summary(lease),
            }
            for lease in leases
        ]
        return Response({"success": True, "data": data})


class TenantPayRentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser, IsLeaseTenant]

    @extend_schema(
        tags=["Payments"],
        summary="Initiate M-Pesa STK Push for rent payment",
        request=InitiateRentPaymentSerializer,
    )
    def post(self, request):
        serializer = InitiateRentPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lease = Lease.objects.select_related("landlord", "property").get(
            pk=serializer.validated_data["lease_id"],
            tenant=request.user,
        )
        phone = serializer.validated_data.get("phone") or request.user.phone
        if not phone:
            return Response(
                {"success": False, "error": {"message": "Phone number is required for M-Pesa payment."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = initiate_rent_payment(lease, request.user, phone)
        except PaymentWorkflowError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "M-Pesa STK Push initiated. Check your phone to complete payment.",
                "data": {
                    "payment_id": str(payment.id),
                    "status": payment.status,
                    "amount": float(payment.amount),
                    "currency": payment.currency,
                    "invoice_number": payment.invoice.invoice_number,
                    "checkout_request_id": payment.mpesa_checkout_request_id,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class TenantPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardResultsSetPagination

    @extend_schema(tags=["Payments"], summary="Payment history")
    def get(self, request):
        qs = (
            Payment.objects.filter(tenant=request.user)
            .select_related("invoice", "invoice__lease", "invoice__lease__property", "receipt")
            .order_by("-created_at")
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = PaymentHistorySerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class TenantPaymentStatusView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]

    @extend_schema(tags=["Payments"], summary="Check payment status")
    def get(self, request, pk):
        payment = Payment.objects.select_related("invoice", "receipt").get(pk=pk, tenant=request.user)
        data = PaymentHistorySerializer(payment, context={"request": request}).data
        return Response({"success": True, "data": data})


class TenantReceiptDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantUser]

    @extend_schema(tags=["Payments"], summary="Download payment receipt")
    def get(self, request, pk):
        receipt = PaymentReceipt.objects.select_related("payment", "payment__invoice").get(
            pk=pk,
            payment__tenant=request.user,
        )
        return Response(
            {
                "success": True,
                "data": PaymentReceiptSerializer(receipt, context={"request": request}).data,
            }
        )
