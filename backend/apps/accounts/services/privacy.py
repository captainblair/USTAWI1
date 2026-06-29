import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.accounts.models import NotificationPreference, UserProfile
from apps.applications.models import RentalApplication
from apps.leases.models import Lease, LeaseStatus
from apps.maintenance.models import MaintenanceRequest
from apps.notifications.models import Notification
from apps.payments.models import Invoice, Payment
from apps.properties.models import Property, PropertyStatus, SavedProperty
from apps.support.models import SupportCase

User = get_user_model()

ACTIVE_LEASE_STATUSES = (LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON)


def export_user_data(user) -> dict:
    profile = getattr(user, "profile", None)
    prefs = NotificationPreference.objects.filter(user=user).first()

    applications = RentalApplication.objects.filter(tenant=user).values(
        "id", "status", "screening_score", "submitted_at", "updated_at", "property_id"
    )
    leases = Lease.objects.filter(tenant=user).values(
        "id", "status", "rent_amount", "currency", "start_date", "end_date", "property_id"
    )
    landlord_leases = Lease.objects.filter(landlord=user).values(
        "id", "status", "rent_amount", "currency", "start_date", "end_date", "property_id"
    )
    payments = Payment.objects.filter(tenant=user).values(
        "id", "amount", "currency", "status", "completed_at", "invoice_id"
    )
    invoices = Invoice.objects.filter(lease__tenant=user).values(
        "id", "amount", "currency", "status", "due_date", "paid_at"
    )
    maintenance = MaintenanceRequest.objects.filter(tenant=user).values(
        "id", "title", "status", "category", "urgency", "created_at"
    )
    notifications = Notification.objects.filter(user=user).values(
        "id", "title", "message", "category", "is_read", "created_at"
    )
    support_cases = SupportCase.objects.filter(reporter=user).values(
        "id", "subject", "status", "category", "created_at"
    )
    saved = SavedProperty.objects.filter(user=user).values("property_id", "created_at")
    login_activity = user.login_activities.values(
        "ip_address", "user_agent", "location", "success", "created_at"
    )

    return {
        "exported_at": timezone.now().isoformat(),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            "is_phone_verified": user.is_phone_verified,
            "created_at": user.created_at,
            "last_login": user.last_login,
        },
        "profile": {
            "full_name": profile.full_name if profile else "",
            "date_of_birth": profile.date_of_birth if profile else None,
            "address": profile.address if profile else "",
            "city": profile.city if profile else "",
            "country": profile.country if profile else "",
        },
        "notification_preferences": {
            "email_rent_reminders": prefs.email_rent_reminders if prefs else None,
            "email_application_updates": prefs.email_application_updates if prefs else None,
            "email_maintenance_alerts": prefs.email_maintenance_alerts if prefs else None,
            "email_payment_updates": prefs.email_payment_updates if prefs else None,
            "sms_rent_reminders": prefs.sms_rent_reminders if prefs else None,
            "push_enabled": prefs.push_enabled if prefs else None,
        },
        "applications": list(applications),
        "leases_as_tenant": list(leases),
        "leases_as_landlord": list(landlord_leases),
        "payments": list(payments),
        "invoices": list(invoices),
        "maintenance_requests": list(maintenance),
        "notifications": list(notifications),
        "support_cases": list(support_cases),
        "saved_properties": list(saved),
        "login_activity": list(login_activity),
    }


def get_deletion_blockers(user) -> list[str]:
    blockers = []

    if Lease.objects.filter(tenant=user, status__in=ACTIVE_LEASE_STATUSES).exists():
        blockers.append("You have an active lease as a tenant.")

    if Lease.objects.filter(landlord=user, status__in=ACTIVE_LEASE_STATUSES).exists():
        blockers.append("You have active leases as a landlord.")

    if Property.objects.filter(
        owner=user,
        status__in=[PropertyStatus.ACTIVE, PropertyStatus.OCCUPIED, PropertyStatus.PENDING_REVIEW],
    ).exists():
        blockers.append("You still have active or pending property listings.")

    return blockers


@transaction.atomic
def delete_user_account(user, *, reason: str = "") -> None:
    blockers = get_deletion_blockers(user)
    if blockers:
        raise ValueError("; ".join(blockers))

    deleted_id = uuid.uuid4().hex[:12]
    anonymized_email = f"deleted-{deleted_id}@deleted.ustawi.local"

    OutstandingToken.objects.filter(user=user).delete()

    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.full_name = "Deleted User"
        profile.address = ""
        profile.date_of_birth = None
        profile.avatar = None
        profile.save()

    user.email = anonymized_email
    user.phone = None
    user.is_active = False
    user.set_unusable_password()
    user.save(update_fields=["email", "phone", "is_active", "password"])

    NotificationPreference.objects.filter(user=user).update(
        email_rent_reminders=False,
        email_application_updates=False,
        email_maintenance_alerts=False,
        email_payment_updates=False,
        email_system_alerts=False,
        sms_rent_reminders=False,
        sms_application_updates=False,
        sms_maintenance_alerts=False,
        push_enabled=False,
    )
