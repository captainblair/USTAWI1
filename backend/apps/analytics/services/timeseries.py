from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from apps.payments.models import Payment, PaymentStatus


def _month_range(months: int):
    today = timezone.now().date()
    result = []
    year, month = today.year, today.month
    for _ in range(months):
        result.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(result))


def _chart_line(labels, values, label="Value", currency="KES"):
    return {
        "type": "line",
        "labels": labels,
        "datasets": [{"label": label, "data": [float(v) for v in values], "currency": currency}],
    }


def _chart_bar(labels, values, label="Count"):
    return {
        "type": "bar",
        "labels": labels,
        "datasets": [{"label": label, "data": list(values)}],
    }


def _chart_donut(labels, values):
    return {
        "type": "donut",
        "labels": labels,
        "datasets": [{"data": list(values)}],
    }


def revenue_timeseries(landlord=None, months: int = 6) -> dict:
    qs = Payment.objects.filter(status=PaymentStatus.COMPLETED)
    if landlord:
        qs = qs.filter(landlord=landlord)

    since = timezone.now() - timedelta(days=months * 31)
    monthly = (
        qs.filter(completed_at__gte=since)
        .annotate(month=TruncMonth("completed_at"))
        .values("month")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0")), count=Count("id"))
        .order_by("month")
    )
    by_month = {}
    for row in monthly:
        if row["month"]:
            key = row["month"].strftime("%Y-%m")
            by_month[key] = {"total": row["total"], "count": row["count"]}

    labels = []
    totals = []
    for year, month in _month_range(months):
        key = f"{year}-{month:02d}"
        labels.append(key)
        totals.append(by_month.get(key, {}).get("total", Decimal("0")))

    return _chart_line(labels, totals, label="Revenue", currency="KES")


def user_growth_timeseries(months: int = 6) -> dict:
    from apps.accounts.models import User

    since = timezone.now() - timedelta(days=months * 31)
    monthly = (
        User.objects.filter(created_at__gte=since)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )
    by_month = {row["month"].strftime("%Y-%m"): row["count"] for row in monthly if row["month"]}

    labels = []
    counts = []
    for year, month in _month_range(months):
        key = f"{year}-{month:02d}"
        labels.append(key)
        counts.append(by_month.get(key, 0))

    return _chart_bar(labels, counts, label="New Users")


def application_status_chart(applications_qs) -> dict:
    from apps.applications.models import ApplicationStatus

    counts = applications_qs.values("status").annotate(count=Count("id"))
    by_status = {row["status"]: row["count"] for row in counts}
    labels = []
    values = []
    for status, label in ApplicationStatus.choices:
        if by_status.get(status, 0) > 0:
            labels.append(label)
            values.append(by_status[status])
    return _chart_donut(labels, values)


def occupancy_donut(occupied: int, vacant: int, other: int) -> dict:
    labels = []
    values = []
    if occupied:
        labels.append("Occupied")
        values.append(occupied)
    if vacant:
        labels.append("Vacant / Active")
        values.append(vacant)
    if other:
        labels.append("Other")
        values.append(other)
    return _chart_donut(labels, values)
