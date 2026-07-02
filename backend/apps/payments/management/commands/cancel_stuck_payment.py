from django.core.management.base import BaseCommand, CommandError

from apps.payments.models import Invoice, Payment, PaymentStatus
from apps.payments.services.workflow import PaymentWorkflowError, cancel_stuck_payment


class Command(BaseCommand):
    help = "Cancel a stuck PENDING/PROCESSING rent payment so the tenant can pay again."

    def add_arguments(self, parser):
        parser.add_argument("--payment-id", type=str, help="Payment UUID to cancel")
        parser.add_argument("--invoice-number", type=str, help="Invoice number (e.g. INV-202607-32F872)")
        parser.add_argument(
            "--reason",
            type=str,
            default="Cancelled by admin — tenant restarting payment.",
        )

    def handle(self, *args, **options):
        payment = None
        payment_id = options.get("payment_id")
        invoice_number = options.get("invoice_number")

        if payment_id:
            payment = Payment.objects.select_related("invoice").filter(pk=payment_id).first()
        elif invoice_number:
            payment = (
                Payment.objects.select_related("invoice")
                .filter(
                    invoice__invoice_number=invoice_number,
                    status__in=(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
                )
                .order_by("-created_at")
                .first()
            )
        else:
            raise CommandError("Provide --payment-id or --invoice-number.")

        if not payment:
            raise CommandError("No matching in-progress payment found.")

        try:
            cancel_stuck_payment(payment, reason=options["reason"])
        except PaymentWorkflowError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Cancelled payment {payment.id} for invoice {payment.invoice.invoice_number} "
                f"(invoice status: {payment.invoice.status})."
            )
        )
