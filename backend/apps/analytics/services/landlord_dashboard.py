from django.db.models import Count
from django.utils import timezone

from apps.analytics.services.timeseries import (
    application_status_chart,
    occupancy_donut,
    revenue_timeseries,
)
from apps.applications.models import RentalApplication
from apps.leases.models import Lease, LeaseStatus
from apps.payments.services.analytics import get_landlord_monthly_summary
from apps.properties.models import Property, PropertyStatus


def get_landlord_dashboard(user, request=None) -> dict:
    properties = Property.objects.filter(owner=user)
    total = properties.count()
    active = properties.filter(status=PropertyStatus.ACTIVE).count()
    occupied = properties.filter(status=PropertyStatus.OCCUPIED).count()
    pending_review = properties.filter(status=PropertyStatus.PENDING_REVIEW).count()

    rentable = active + occupied
    occupancy_rate = round((occupied / rentable * 100), 1) if rentable else 0.0

    today = timezone.now().date()
    monthly = get_landlord_monthly_summary(user, today.year, today.month)

    applications_qs = RentalApplication.objects.filter(property__owner=user)
    pending_apps = applications_qs.filter(
        status__in=["SUBMITTED", "UNDER_REVIEW"]
    ).count()

    top_performers = (
        properties.filter(status__in=[PropertyStatus.ACTIVE, PropertyStatus.OCCUPIED])
        .annotate(application_count=Count("applications"))
        .order_by("-views_count", "-safety_score", "-application_count")[:5]
    )

    performers = [
        {
            "id": str(p.id),
            "title": p.title,
            "status": p.status,
            "views_count": p.views_count,
            "safety_score": float(p.safety_score),
            "application_count": p.application_count,
            "monthly_rent": float(p.price_monthly),
        }
        for p in top_performers
    ]

    active_leases = Lease.objects.filter(
        landlord=user, status__in=[LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON]
    ).count()

    return {
        "kpis": {
            "total_properties": total,
            "active_listings": active,
            "occupied_properties": occupied,
            "active_leases": active_leases,
            "occupancy_rate": occupancy_rate,
            "monthly_income": float(monthly["total_collected"]),
            "currency": monthly["currency"],
            "pending_applications": pending_apps,
            "pending_verification": pending_review,
        },
        "top_performers": performers,
        "charts": {
            "revenue_trend": revenue_timeseries(landlord=user, months=6),
            "applications_by_status": application_status_chart(applications_qs),
            "occupancy_breakdown": occupancy_donut(
                occupied=occupied,
                vacant=active,
                other=total - active - occupied,
            ),
        },
    }
