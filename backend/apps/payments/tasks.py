import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def process_mpesa_callback_task(self, payment_id: str, payload: dict):
    from apps.payments.services.workflow import process_mpesa_callback

    try:
        process_mpesa_callback(payment_id, payload)
    except Exception as exc:
        logger.exception("M-Pesa callback processing failed for payment %s", payment_id)
        raise self.retry(exc=exc) from exc


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_payment_receipt_email_task(self, payment_id: str):
    from apps.payments.models import Payment

    try:
        payment = Payment.objects.select_related("tenant", "invoice", "receipt").get(pk=payment_id)
    except Payment.DoesNotExist:
        return

    if not hasattr(payment, "receipt"):
        return

    receipt = payment.receipt
    subject = f"Ustawi rent receipt — {receipt.receipt_number}"
    message = (
        f"Hello,\n\n"
        f"Your rent payment of {payment.currency} {payment.amount} was received.\n\n"
        f"Receipt: {receipt.receipt_number}\n"
        f"Invoice: {payment.invoice.invoice_number}\n"
        f"M-Pesa Ref: {payment.mpesa_receipt_number}\n"
        f"Date: {payment.completed_at}\n\n"
        f"Thank you for using Ustawi.\n"
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[payment.tenant.email],
        fail_silently=True,
    )
    from django.utils import timezone

    receipt.emailed_at = timezone.now()
    receipt.save(update_fields=["emailed_at", "updated_at"])
    logger.info("Receipt email sent for payment %s", payment_id)
