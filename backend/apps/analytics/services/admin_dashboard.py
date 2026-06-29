from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.accounts.models import User
from apps.analytics.services.timeseries import (
    occupancy_donut,
    revenue_timeseries,
    user_growth_timeseries,
)
from apps.leases.models import Lease, LeaseStatus
from apps.payments.models import Payment, PaymentStatus
from apps.properties.models import Property, PropertyStatus
from apps.verification.models import VerificationCase, VerificationCaseStatus
from apps.verification.services.analytics import get_pipeline_stats


def get_admin_dashboard(request=None) -> dict:
    total_users = User.objects.count()
    today = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_month = User.objects.filter(created_at__gte=month_start).count()

    users_by_role = User.objects.values("role").annotate(count=Count("id"))
    role_breakdown = {row["role"]: row["count"] for row in users_by_role}

    total_revenue = Payment.objects.filter(status=PaymentStatus.COMPLETED).aggregate(
        total=Coalesce(Sum("amount"), Decimal("0"))
    )["total"]

    month_revenue = Payment.objects.filter(
        status=PaymentStatus.COMPLETED,
        completed_at__gte=month_start,
    ).aggregate(total=Coalesce(Sum("amount"), Decimal("0")))["total"]

    properties = Property.objects.all()
    active_listings = properties.filter(status=PropertyStatus.ACTIVE).count()
    occupied = properties.filter(status=PropertyStatus.OCCUPIED).count()
    pending_verifications = VerificationCase.objects.filter(
        status__in=[
            VerificationCaseStatus.PENDING,
            VerificationCaseStatus.IN_REVIEW,
            VerificationCaseStatus.AWAITING_DOCS,
        ]
    ).count()

    rentable = active_listings + occupied
    occupancy_rate = round((occupied / rentable * 100), 1) if rentable else 0.0

    pipeline = get_pipeline_stats()
    verification_donut = {
        "type": "donut",
        "labels": [item["status"].replace("_", " ").title() for item in pipeline["breakdown"]],
        "datasets": [{"data": [item["count"] for item in pipeline["breakdown"]]}],
    }

    listings_by_status = properties.values("status").annotate(count=Count("id"))
    listing_labels = [row["status"] for row in listings_by_status if row["count"]]
    listing_values = [row["count"] for row in listings_by_status if row["count"]]

    active_leases = Lease.objects.filter(
        status__in=[LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON]
    ).count()

    return {
        "kpis": {
            "total_users": total_users,
            "new_users_this_month": new_users_month,
            "users_by_role": role_breakdown,
            "total_revenue": float(total_revenue),
            "revenue_this_month": float(month_revenue),
            "currency": "KES",
            "active_listings": active_listings,
            "occupied_properties": occupied,
            "active_leases": active_leases,
            "platform_occupancy_rate": occupancy_rate,
            "pending_verifications": pending_verifications,
        },
        "charts": {
            "user_growth": user_growth_timeseries(months=6),
            "revenue_trend": revenue_timeseries(months=6),
            "verification_pipeline": verification_donut,
            "listings_by_status": {
                "type": "bar",
                "labels": listing_labels,
                "datasets": [{"label": "Properties", "data": listing_values}],
            },
            "occupancy_breakdown": occupancy_donut(
                occupied=occupied,
                vacant=active_listings,
                other=properties.count() - active_listings - occupied,
            ),
        },
    }
