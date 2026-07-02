from django.core.management.base import BaseCommand, CommandError

from apps.payments.models import Invoice, Payment, PaymentStatus
from apps.payments.services.workflow import (
    PaymentWorkflowError,
    cancel_stuck_payment,
    revert_payment_for_testing,
)


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
        parser.add_argument(
            "--revert-completed",
            action="store_true",
            help="Also revert the latest COMPLETED payment on the invoice (for testing).",
        )

    def handle(self, *args, **options):
        payment = None
        payment_id = options.get("payment_id")
        invoice_number = options.get("invoice_number")

        if payment_id:
            payment = Payment.objects.select_related("invoice").filter(pk=payment_id).first()
        elif invoice_number:
            statuses = [PaymentStatus.PENDING, PaymentStatus.PROCESSING]
            if options["revert_completed"]:
                statuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.PROCESSING]
            payment = (
                Payment.objects.select_related("invoice")
                .filter(
                    invoice__invoice_number=invoice_number,
                    status__in=statuses,
                )
                .order_by("-created_at")
                .first()
            )
        else:
            raise CommandError("Provide --payment-id or --invoice-number.")

        if not payment:
            raise CommandError("No matching payment found.")

        try:
            if payment.status == PaymentStatus.COMPLETED:
                revert_payment_for_testing(payment, reason=options["reason"])
            else:
                cancel_stuck_payment(payment, reason=options["reason"])
        except PaymentWorkflowError as exc:
            raise CommandError(str(exc)) from exc

        payment.refresh_from_db()
        invoice = payment.invoice
        invoice.refresh_from_db()
        action = "Reverted" if payment.status == PaymentStatus.REFUNDED else "Cancelled"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} payment {payment.id} for invoice {invoice.invoice_number} "
                f"(invoice status: {invoice.status})."
            )
        )
