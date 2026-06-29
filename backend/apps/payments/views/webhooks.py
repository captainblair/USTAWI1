import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.services.workflow import find_payment_for_callback, process_mpesa_callback
from apps.payments.tasks import process_mpesa_callback_task

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Payments"], summary="M-Pesa STK Push callback webhook")
    def post(self, request):
        payload = request.data
        logger.info("M-Pesa callback received: %s", payload)

        payment = find_payment_for_callback(payload)
        if not payment:
            logger.warning("M-Pesa callback: payment not found for payload")
            return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

        process_mpesa_callback_task.delay(str(payment.id), payload)
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class DevSimulateCallbackView(APIView):
    """DEBUG-only endpoint to simulate M-Pesa callback when Daraja credentials are not configured."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Payments"], summary="[DEV] Simulate M-Pesa callback")
    def post(self, request):
        from django.conf import settings

        if not settings.DEBUG:
            return Response(status=status.HTTP_404_NOT_FOUND)

        from apps.payments.models import Payment, PaymentStatus
        from apps.payments.serializers import DevSimulateCallbackSerializer
        from apps.payments.services.workflow import _build_dev_success_callback

        serializer = DevSimulateCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = Payment.objects.get(pk=serializer.validated_data["payment_id"])
        if serializer.validated_data.get("success", True):
            payload = _build_dev_success_callback(payment)
        else:
            payload = {
                "Body": {
                    "stkCallback": {
                        "MerchantRequestID": payment.mpesa_merchant_request_id,
                        "CheckoutRequestID": payment.mpesa_checkout_request_id,
                        "ResultCode": 1,
                        "ResultDesc": "Simulated failure",
                    }
                }
            }

        if payment.status == PaymentStatus.COMPLETED:
            return Response({"success": True, "message": "Payment already completed."})

        process_mpesa_callback(str(payment.id), payload)
        payment.refresh_from_db()
        return Response(
            {
                "success": True,
                "message": "Callback simulated.",
                "data": {"payment_id": str(payment.id), "status": payment.status},
            }
        )
