from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce

from apps.payments.models import Invoice, InvoiceStatus, Payment, PaymentStatus


def get_landlord_monthly_summary(landlord, year: int, month: int) -> dict:
    start = date(year, month, 1)
    last_day = monthrange(year, month)[1]
    end = date(year, month, last_day)

    payments = Payment.objects.filter(
        landlord=landlord,
        status=PaymentStatus.COMPLETED,
        completed_at__date__gte=start,
        completed_at__date__lte=end,
    )
    agg = payments.aggregate(
        total=Coalesce(Sum("amount"), Decimal("0")),
        count=Count("id"),
    )

    invoices = Invoice.objects.filter(lease__landlord=landlord)
    pending = invoices.filter(status=InvoiceStatus.PENDING).count()
    overdue = invoices.filter(status=InvoiceStatus.OVERDUE).count()

    return {
        "month": f"{year}-{month:02d}",
        "total_collected": agg["total"],
        "currency": "KES",
        "payment_count": agg["count"],
        "pending_invoices": pending,
        "overdue_invoices": overdue,
    }
