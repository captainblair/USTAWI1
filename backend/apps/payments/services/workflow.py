import logging
import secrets

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from apps.payments.models import (
    InvoiceStatus,
    Payment,
    PaymentReceipt,
    PaymentStatus,
)
from apps.payments.services.daraja import MpesaDarajaClient, MpesaDarajaError
from apps.payments.services.invoice import get_or_create_current_invoice, mark_invoice_paid

logger = logging.getLogger(__name__)


class PaymentWorkflowError(Exception):
    pass


def _generate_idempotency_key() -> str:
    return secrets.token_hex(16)


def _generate_receipt_number() -> str:
    today = timezone.now().strftime("%Y%m%d")
    return f"RCP-{today}-{secrets.token_hex(3).upper()}"


STALE_PAYMENT_MINUTES = 15


def expire_stale_in_progress_payments(*, invoice=None) -> int:
    """Fail abandoned PENDING/PROCESSING payments so tenants can retry."""
    cutoff = timezone.now() - timezone.timedelta(minutes=STALE_PAYMENT_MINUTES)
    qs = Payment.objects.filter(
        status__in=(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
        created_at__lt=cutoff,
    )
    if invoice is not None:
        qs = qs.filter(invoice=invoice)

    count = 0
    for payment in qs:
        cancel_stuck_payment(payment, reason="Payment timed out. Please try again.")
        count += 1
    return count


def cancel_stuck_payment(payment: Payment, *, reason: str = "Payment cancelled.") -> Payment:
    """Mark an in-flight payment as failed and restore invoice to payable if needed."""
    from apps.payments.models import PaymentReceipt

    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.PROCESSING):
        raise PaymentWorkflowError(f"Payment {payment.id} is {payment.status} and cannot be cancelled.")

    PaymentReceipt.objects.filter(payment=payment).delete()

    payment.status = PaymentStatus.FAILED
    payment.mpesa_result_desc = reason
    payment.completed_at = timezone.now()
    payment.save(update_fields=["status", "mpesa_result_desc", "completed_at", "updated_at"])

    invoice = payment.invoice
    if invoice.status == InvoiceStatus.PAID:
        today = timezone.now().date()
        invoice.status = InvoiceStatus.OVERDUE if today > invoice.due_date else InvoiceStatus.PENDING
        invoice.paid_at = None
        invoice.save(update_fields=["status", "paid_at", "updated_at"])

    return payment


def revert_payment_for_testing(payment: Payment, *, reason: str = "Reverted for testing.") -> Payment:
    """Undo a completed payment so the tenant can run the pay flow again (staging/demo)."""
    from apps.payments.models import PaymentReceipt

    if payment.status not in (PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.PROCESSING):
        raise PaymentWorkflowError(f"Payment {payment.id} is {payment.status} and cannot be reverted.")

    PaymentReceipt.objects.filter(payment=payment).delete()

    payment.status = PaymentStatus.REFUNDED
    payment.mpesa_result_desc = reason
    if not payment.completed_at:
        payment.completed_at = timezone.now()
    payment.save(update_fields=["status", "mpesa_result_desc", "completed_at", "updated_at"])

    invoice = payment.invoice
    today = timezone.now().date()
    invoice.status = InvoiceStatus.OVERDUE if today > invoice.due_date else InvoiceStatus.PENDING
    invoice.paid_at = None
    invoice.save(update_fields=["status", "paid_at", "updated_at"])

    return payment


def initiate_rent_payment(lease, tenant, phone: str) -> Payment:
    invoice = get_or_create_current_invoice(lease)
    expire_stale_in_progress_payments(invoice=invoice)

    if invoice.status == InvoiceStatus.PAID:
        raise PaymentWorkflowError("Rent for this billing period is already paid.")

    if Payment.objects.filter(
        invoice=invoice,
        status__in=(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
    ).exists():
        raise PaymentWorkflowError("A payment is already in progress for this invoice.")

    payment = Payment.objects.create(
        invoice=invoice,
        tenant=tenant,
        landlord=lease.landlord,
        amount=invoice.amount,
        currency=invoice.currency,
        status=PaymentStatus.PENDING,
        phone_number=phone,
        idempotency_key=_generate_idempotency_key(),
        initiated_at=timezone.now(),
    )

    client = MpesaDarajaClient()
    try:
        result = client.stk_push(
            phone=phone,
            amount=int(invoice.amount),
            account_reference=invoice.invoice_number,
            transaction_desc=f"Rent {lease.property.title[:20]}",
        )
    except MpesaDarajaError as exc:
        payment.status = PaymentStatus.FAILED
        payment.mpesa_result_desc = str(exc)
        payment.completed_at = timezone.now()
        payment.save(update_fields=["status", "mpesa_result_desc", "completed_at", "updated_at"])
        raise PaymentWorkflowError(str(exc)) from exc

    payment.status = PaymentStatus.PROCESSING
    payment.mpesa_checkout_request_id = result.get("CheckoutRequestID", "")
    payment.mpesa_merchant_request_id = result.get("MerchantRequestID", "")
    payment.mpesa_result_desc = result.get("ResponseDescription", "")
    payment.save(
        update_fields=[
            "status",
            "mpesa_checkout_request_id",
            "mpesa_merchant_request_id",
            "mpesa_result_desc",
            "updated_at",
        ]
    )

    if result.get("status") == "dev_mode":
        dev_callback = _build_dev_success_callback(payment)
        # Only auto-complete in local DEBUG. Production demo flow completes on the confirm page.
        if settings.DEBUG:
            try:
                process_mpesa_callback(str(payment.id), dev_callback)
            except Exception:
                logger.exception("Dev mode payment callback failed during initiate for %s", payment.id)

    return payment


def schedule_mpesa_callback(payment_id: str, payload: dict) -> None:
    """Queue callback processing without failing the HTTP request that initiated payment."""
    from apps.payments.tasks import process_mpesa_callback_task

    try:
        process_mpesa_callback_task.delay(payment_id, payload)
    except Exception:
        logger.exception("Celery enqueue failed for payment %s; running callback in-process", payment_id)
        try:
            process_mpesa_callback(payment_id, payload)
        except Exception:
            logger.exception("In-process payment callback failed for %s", payment_id)


def _build_dev_success_callback(payment: Payment) -> dict:
    receipt = f"DEV{secrets.token_hex(4).upper()}"
    return {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": payment.mpesa_merchant_request_id,
                "CheckoutRequestID": payment.mpesa_checkout_request_id,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": float(payment.amount)},
                        {"Name": "MpesaReceiptNumber", "Value": receipt},
                        {"Name": "TransactionDate", "Value": timezone.now().strftime("%Y%m%d%H%M%S")},
                        {"Name": "PhoneNumber", "Value": payment.phone_number.replace("+", "")},
                    ]
                },
            }
        }
    }


def parse_stk_callback(payload: dict) -> dict:
    callback = payload.get("Body", {}).get("stkCallback", payload.get("stkCallback", payload))
    metadata = {}
    for item in callback.get("CallbackMetadata", {}).get("Item", []):
        metadata[item.get("Name")] = item.get("Value")

    return {
        "merchant_request_id": callback.get("MerchantRequestID", ""),
        "checkout_request_id": callback.get("CheckoutRequestID", ""),
        "result_code": str(callback.get("ResultCode", "")),
        "result_desc": callback.get("ResultDesc", ""),
        "amount": metadata.get("Amount"),
        "mpesa_receipt_number": metadata.get("MpesaReceiptNumber", ""),
        "transaction_date": str(metadata.get("TransactionDate", "")),
        "phone_number": str(metadata.get("PhoneNumber", "")),
    }


@transaction.atomic
def process_mpesa_callback(payment_id: str, payload: dict) -> Payment:
    payment = Payment.objects.select_for_update().select_related("invoice").get(pk=payment_id)

    if payment.status == PaymentStatus.COMPLETED:
        return payment

    parsed = parse_stk_callback(payload)
    payment.raw_callback = payload

    if parsed["checkout_request_id"] and not payment.mpesa_checkout_request_id:
        payment.mpesa_checkout_request_id = parsed["checkout_request_id"]

    payment.mpesa_result_code = parsed["result_code"]
    payment.mpesa_result_desc = parsed["result_desc"]

    if parsed["result_code"] != "0":
        payment.status = PaymentStatus.FAILED
        payment.completed_at = timezone.now()
        payment.save()
        return payment

    receipt_number = parsed.get("mpesa_receipt_number") or ""
    if receipt_number and Payment.objects.filter(
        mpesa_receipt_number=receipt_number,
        status=PaymentStatus.COMPLETED,
    ).exclude(pk=payment.pk).exists():
        return payment

    payment.status = PaymentStatus.COMPLETED
    payment.mpesa_receipt_number = receipt_number
    payment.mpesa_transaction_date = parsed.get("transaction_date", "")
    payment.completed_at = timezone.now()
    payment.save()

    mark_invoice_paid(payment.invoice)
    try:
        _create_receipt(payment)
    except Exception:
        logger.exception("Receipt generation failed for payment %s", payment.id)

    try:
        from apps.notifications.services.triggers import notify_payment_completed

        payment.refresh_from_db()
        notify_payment_completed(payment)
    except Exception:
        logger.exception("Payment notification failed for %s", payment.id)

    try:
        from apps.payments.tasks import send_payment_receipt_email_task

        send_payment_receipt_email_task.delay(str(payment.id))
    except Exception:
        logger.exception("Receipt email enqueue failed for payment %s", payment.id)

    return payment


def find_payment_for_callback(payload: dict) -> Payment | None:
    parsed = parse_stk_callback(payload)
    checkout_id = parsed.get("checkout_request_id")
    if checkout_id:
        payment = Payment.objects.filter(mpesa_checkout_request_id=checkout_id).first()
        if payment:
            return payment

    merchant_id = parsed.get("merchant_request_id")
    if merchant_id:
        return Payment.objects.filter(mpesa_merchant_request_id=merchant_id).first()
    return None


def _create_receipt(payment: Payment) -> PaymentReceipt:
    if hasattr(payment, "receipt"):
        from apps.payments.services.receipt_pdf import ensure_receipt_pdf_file

        ensure_receipt_pdf_file(payment.receipt)
        return payment.receipt

    from apps.payments.services.receipt_pdf import generate_payment_receipt_pdf

    receipt_number = _generate_receipt_number()
    pdf = generate_payment_receipt_pdf(payment, receipt_number=receipt_number)

    receipt = PaymentReceipt.objects.create(
        payment=payment,
        receipt_number=receipt_number,
    )
    receipt.receipt_file.save(f"{receipt_number}.pdf", pdf, save=True)
    return receipt
