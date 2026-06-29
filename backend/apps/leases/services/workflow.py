from datetime import date
from decimal import Decimal

from django.core.files.base import ContentFile
from django.utils import timezone

from apps.applications.models import ApplicationStatus, RentalApplication
from apps.leases.models import (
    DigitalSignature,
    Lease,
    LeaseDocument,
    LeaseDocumentType,
    LeaseStatus,
    SignatureMethod,
    SignerRole,
)
from apps.properties.models import PropertyStatus


class LeaseWorkflowError(Exception):
    pass


RENEWAL_REMINDER_DAYS = 60


def _default_end_date(start_date: date, duration_months: int) -> date:
    month = start_date.month - 1 + duration_months
    year = start_date.year + month // 12
    month = month % 12 + 1
    day = min(start_date.day, 28)
    return date(year, month, day)


def create_lease_from_application(
    application: RentalApplication,
    actor,
    *,
    duration_months: int = 12,
    rent_due_day: int = 1,
    deposit_amount: Decimal | None = None,
    notes: str = "",
) -> Lease:
    if application.status != ApplicationStatus.APPROVED:
        raise LeaseWorkflowError("Lease can only be created from an approved application.")

    if hasattr(application, "lease"):
        return application.lease

    prop = application.property
    start_date = application.move_in_date or timezone.now().date()
    end_date = _default_end_date(start_date, duration_months)
    deposit = deposit_amount if deposit_amount is not None else prop.price_monthly

    lease = Lease.objects.create(
        application=application,
        tenant=application.tenant,
        landlord=prop.owner,
        property=prop,
        status=LeaseStatus.PENDING_SIGNATURE,
        rent_amount=prop.price_monthly,
        currency=prop.currency,
        rent_due_day=rent_due_day,
        deposit_amount=deposit,
        duration_months=duration_months,
        furnished=prop.furnished,
        start_date=start_date,
        end_date=end_date,
        notes=notes,
    )

    LeaseDocument.objects.create(
        lease=lease,
        doc_type=LeaseDocumentType.LEASE_AGREEMENT,
        title=f"Lease Agreement — {prop.title}",
        file=_placeholder_pdf(lease),
        uploaded_by=actor,
    )

    from apps.notifications.models import NotificationCategory
    from apps.notifications.services.dispatch import send_notification

    send_notification(
        lease.tenant,
        NotificationCategory.SYSTEM,
        "Lease ready for signature",
        f"Your lease for {prop.title} is ready. Please review and sign.",
        reference_type="lease",
        reference_id=lease.id,
        action_path=f"/leases/{lease.id}",
        event_type="lease_created",
        email_subject="Lease ready for signature",
        email_body=f"Your lease for {prop.title} is ready to sign on Ustawi.",
    )
    return lease


def _placeholder_pdf(lease: Lease) -> ContentFile:
    content = (
        f"Ustawi Lease Agreement\n"
        f"Property: {lease.property.title}\n"
        f"Tenant: {lease.tenant.email}\n"
        f"Landlord: {lease.landlord.email}\n"
        f"Rent: {lease.currency} {lease.rent_amount}/month\n"
        f"Term: {lease.start_date} to {lease.end_date}\n"
        f"Due day: {lease.rent_due_day}\n"
        f"Furnished: {'Yes' if lease.furnished else 'No'}\n"
    ).encode("utf-8")
    return ContentFile(content, name=f"lease-{lease.id}.pdf")


def refresh_lease_status(lease: Lease) -> Lease:
    if lease.status in (LeaseStatus.TERMINATED, LeaseStatus.PENDING_SIGNATURE):
        return lease

    today = timezone.now().date()
    if today > lease.end_date:
        if lease.status != LeaseStatus.EXPIRED:
            lease.status = LeaseStatus.EXPIRED
            lease.save(update_fields=["status", "updated_at"])
        return lease

    days_left = (lease.end_date - today).days
    if lease.status == LeaseStatus.ACTIVE and days_left <= RENEWAL_REMINDER_DAYS:
        lease.status = LeaseStatus.EXPIRING_SOON
        lease.save(update_fields=["status", "updated_at"])
    elif lease.status == LeaseStatus.EXPIRING_SOON and days_left > RENEWAL_REMINDER_DAYS:
        lease.status = LeaseStatus.ACTIVE
        lease.save(update_fields=["status", "updated_at"])

    return lease


def get_renewal_reminder(lease: Lease) -> dict:
    lease = refresh_lease_status(lease)
    today = timezone.now().date()
    days_until_end = max((lease.end_date - today).days, 0)
    return {
        "days_until_end": days_until_end,
        "renewal_due_soon": days_until_end <= RENEWAL_REMINDER_DAYS and lease.status != LeaseStatus.EXPIRED,
        "renewal_reminder_days": RENEWAL_REMINDER_DAYS,
        "end_date": lease.end_date.isoformat(),
    }


def sign_lease(lease: Lease, actor, role: str, request=None) -> Lease:
    if lease.status != LeaseStatus.PENDING_SIGNATURE:
        raise LeaseWorkflowError("Only leases pending signature can be signed.")

    if role == SignerRole.TENANT:
        if lease.tenant_id != actor.id:
            raise LeaseWorkflowError("Only the tenant can sign as tenant.")
        if lease.tenant_signed_at:
            raise LeaseWorkflowError("Tenant has already signed.")
        lease.tenant_signed_at = timezone.now()
    elif role == SignerRole.LANDLORD:
        if lease.landlord_id != actor.id and actor.role not in ("ADMIN",) and not actor.is_superuser:
            raise LeaseWorkflowError("Only the landlord can sign as landlord.")
        if lease.landlord_signed_at:
            raise LeaseWorkflowError("Landlord has already signed.")
        lease.landlord_signed_at = timezone.now()
    else:
        raise LeaseWorkflowError("Invalid signer role.")

    ip_address = None
    user_agent = ""
    if request:
        ip_address = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get(
            "REMOTE_ADDR"
        )
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

    DigitalSignature.objects.create(
        lease=lease,
        signer=actor,
        signer_role=role,
        signature_method=SignatureMethod.ELECTRONIC,
        signed_at=timezone.now(),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={"lease_id": str(lease.id)},
    )

    lease.save(update_fields=["tenant_signed_at", "landlord_signed_at", "updated_at"])

    if lease.tenant_signed_at and lease.landlord_signed_at:
        _activate_lease(lease)

    return lease


def _activate_lease(lease: Lease) -> Lease:
    lease.status = LeaseStatus.ACTIVE
    lease.activated_at = timezone.now()
    lease.save(update_fields=["status", "activated_at", "updated_at"])

    agreement = lease.documents.filter(doc_type=LeaseDocumentType.LEASE_AGREEMENT).first()
    if agreement and agreement.file:
        lease.signed_pdf.save(
            f"signed-{lease.id}.pdf",
            agreement.file,
            save=False,
        )
        lease.save(update_fields=["signed_pdf", "updated_at"])

        LeaseDocument.objects.get_or_create(
            lease=lease,
            doc_type=LeaseDocumentType.SIGNED_COPY,
            defaults={
                "title": f"Signed Lease — {lease.property.title}",
                "file": lease.signed_pdf,
                "uploaded_by": lease.landlord,
            },
        )

    prop = lease.property
    prop.status = PropertyStatus.OCCUPIED
    prop.save(update_fields=["status", "updated_at"])
    return lease


def terminate_lease(lease: Lease, actor, reason: str = "") -> Lease:
    if lease.status not in (LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON):
        raise LeaseWorkflowError("Only active leases can be terminated.")

    lease.status = LeaseStatus.TERMINATED
    lease.terminated_at = timezone.now()
    lease.termination_reason = reason
    lease.save(update_fields=["status", "terminated_at", "termination_reason", "updated_at"])

    prop = lease.property
    prop.status = PropertyStatus.VACANT
    prop.save(update_fields=["status", "updated_at"])
    return lease


def upload_lease_document(
    lease: Lease,
    actor,
    *,
    doc_type: str,
    title: str,
    file,
    is_shareable: bool = True,
) -> LeaseDocument:
    return LeaseDocument.objects.create(
        lease=lease,
        doc_type=doc_type,
        title=title,
        file=file,
        is_shareable=is_shareable,
        uploaded_by=actor,
    )
