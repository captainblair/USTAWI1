import secrets
from datetime import date, timedelta
from decimal import Decimal

from django.utils import timezone

from apps.leases.models import Lease, LeaseStatus
from apps.payments.models import Invoice, InvoiceStatus

PAYABLE_LEASE_STATUSES = (
    LeaseStatus.ACTIVE,
    LeaseStatus.EXPIRING_SOON,
)


class InvoiceServiceError(Exception):
    pass


def _billing_period_for_date(lease: Lease, reference: date) -> tuple[date, date]:
    due_day = min(lease.rent_due_day, 28)
    if reference.day >= due_day:
        period_start = date(reference.year, reference.month, due_day)
    else:
        if reference.month == 1:
            period_start = date(reference.year - 1, 12, due_day)
        else:
            period_start = date(reference.year, reference.month - 1, due_day)

    if period_start.month == 12:
        period_end = date(period_start.year + 1, 1, due_day) - timedelta(days=1)
    else:
        period_end = date(period_start.year, period_start.month + 1, due_day) - timedelta(days=1)

    return period_start, period_end


def _generate_invoice_number() -> str:
    today = timezone.now().strftime("%Y%m")
    suffix = secrets.token_hex(3).upper()
    return f"INV-{today}-{suffix}"


def get_or_create_current_invoice(lease: Lease) -> Invoice:
    if lease.status not in PAYABLE_LEASE_STATUSES:
        raise InvoiceServiceError("Rent invoices are only available for active leases.")

    today = timezone.now().date()
    period_start, period_end = _billing_period_for_date(lease, today)
    due_date = period_start

    invoice, created = Invoice.objects.get_or_create(
        lease=lease,
        billing_period_start=period_start,
        billing_period_end=period_end,
        defaults={
            "invoice_number": _generate_invoice_number(),
            "amount": lease.rent_amount,
            "currency": lease.currency,
            "due_date": due_date,
            "status": InvoiceStatus.PENDING,
            "description": f"Rent for {lease.property.title} ({period_start} — {period_end})",
        },
    )

    if not created and invoice.status == InvoiceStatus.PENDING and today > invoice.due_date:
        invoice.status = InvoiceStatus.OVERDUE
        invoice.save(update_fields=["status", "updated_at"])

    return invoice


def mark_invoice_paid(invoice: Invoice) -> Invoice:
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = timezone.now()
    invoice.save(update_fields=["status", "paid_at", "updated_at"])
    return invoice


def get_rent_due_summary(lease: Lease) -> dict:
    try:
        invoice = get_or_create_current_invoice(lease)
    except InvoiceServiceError:
        return {"is_due": False, "amount": Decimal("0"), "currency": lease.currency}

    today = timezone.now().date()
    is_due = invoice.status in (InvoiceStatus.PENDING, InvoiceStatus.OVERDUE)
    days_overdue = max((today - invoice.due_date).days, 0) if invoice.status == InvoiceStatus.OVERDUE else 0

    return {
        "is_due": is_due,
        "invoice_id": str(invoice.id),
        "invoice_number": invoice.invoice_number,
        "amount": float(invoice.amount),
        "currency": invoice.currency,
        "due_date": invoice.due_date.isoformat(),
        "status": invoice.status,
        "days_overdue": days_overdue,
        "billing_period_start": invoice.billing_period_start.isoformat(),
        "billing_period_end": invoice.billing_period_end.isoformat(),
    }
