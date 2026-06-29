from apps.analytics.services.timeseries import application_status_chart
from apps.applications.models import ApplicationStatus, RentalApplication
from apps.leases.models import Lease, LeaseStatus
from apps.payments.models import Payment, PaymentStatus
from apps.payments.services.invoice import get_rent_due_summary

ACTIVE_LEASE_STATUSES = (LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON)


def get_tenant_dashboard(user, request=None) -> dict:
    active_lease = (
        Lease.objects.filter(tenant=user, status__in=ACTIVE_LEASE_STATUSES)
        .select_related("property", "property__neighborhood")
        .order_by("-activated_at")
        .first()
    )

    upcoming_rent = None
    safety_score = None
    if active_lease:
        upcoming_rent = get_rent_due_summary(active_lease)
        safety_score = float(active_lease.property.safety_score)

    recent_applications = (
        RentalApplication.objects.filter(tenant=user)
        .exclude(status=ApplicationStatus.DRAFT)
        .select_related("property", "property__neighborhood")
        .order_by("-updated_at")[:5]
    )

    app_rows = [
        {
            "id": str(a.id),
            "property_title": a.property.title,
            "status": a.status,
            "screening_score": a.screening_score,
            "submitted_at": a.submitted_at,
            "updated_at": a.updated_at,
        }
        for a in recent_applications
    ]

    payments = Payment.objects.filter(tenant=user, status=PaymentStatus.COMPLETED).order_by("-completed_at")[:6]
    payment_labels = [p.completed_at.strftime("%Y-%m") if p.completed_at else "" for p in reversed(payments)]
    payment_values = [p.amount for p in reversed(payments)]

    from apps.analytics.services.recommendations import get_property_recommendations

    recommendations = get_property_recommendations(user, limit=6, request=request)

    pending_count = RentalApplication.objects.filter(
        tenant=user,
        status__in=[ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW],
    ).count()

    return {
        "kpis": {
            "active_lease": _serialize_active_lease(active_lease) if active_lease else None,
            "upcoming_rent": upcoming_rent,
            "safety_score": safety_score,
            "pending_applications": pending_count,
        },
        "recent_applications": app_rows,
        "recommendations": recommendations,
        "charts": {
            "payment_history": {
                "type": "line",
                "labels": payment_labels,
                "datasets": [
                    {
                        "label": "Rent Paid",
                        "data": [float(v) for v in payment_values],
                        "currency": "KES",
                    }
                ],
            },
            "application_status": application_status_chart(
                RentalApplication.objects.filter(tenant=user).exclude(status=ApplicationStatus.DRAFT)
            ),
        },
    }


def _serialize_active_lease(lease: Lease) -> dict:
    return {
        "id": str(lease.id),
        "property_title": lease.property.title,
        "property_id": str(lease.property.id),
        "status": lease.status,
        "rent_amount": float(lease.rent_amount),
        "currency": lease.currency,
        "start_date": lease.start_date.isoformat(),
        "end_date": lease.end_date.isoformat(),
        "safety_score": float(lease.property.safety_score),
    }
