from django.utils import timezone

from apps.applications.models import ApplicationEventType, ApplicationStatus, RentalApplication
from apps.applications.services.screening import apply_screening, log_event
from apps.properties.models import PropertyStatus


class ApplicationWorkflowError(Exception):
    pass


def submit_application(application: RentalApplication, actor) -> RentalApplication:
    if application.status != ApplicationStatus.DRAFT:
        raise ApplicationWorkflowError("Only draft applications can be submitted.")

    if not application.move_in_date:
        raise ApplicationWorkflowError("Move-in date is required before submitting.")

    if not application.monthly_income or application.monthly_income <= 0:
        raise ApplicationWorkflowError("Monthly income is required before submitting.")

    if application.property.status != PropertyStatus.ACTIVE:
        raise ApplicationWorkflowError("This property is not accepting applications.")

    application.status = ApplicationStatus.SUBMITTED
    application.submitted_at = timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])

    apply_screening(application)
    log_event(
        application,
        ApplicationEventType.SUBMITTED,
        actor=actor,
        message="Application submitted for landlord review.",
    )
    from apps.notifications.services.triggers import notify_application_submitted

    notify_application_submitted(application)
    return application


def withdraw_application(application: RentalApplication, actor) -> RentalApplication:
    if application.status not in (
        ApplicationStatus.DRAFT,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.UNDER_REVIEW,
    ):
        raise ApplicationWorkflowError("This application cannot be withdrawn.")

    application.status = ApplicationStatus.WITHDRAWN
    application.save(update_fields=["status", "updated_at"])
    log_event(
        application,
        ApplicationEventType.WITHDRAWN,
        actor=actor,
        message="Application withdrawn by tenant.",
    )
    return application


def mark_under_review(application: RentalApplication, actor) -> RentalApplication:
    if application.status != ApplicationStatus.SUBMITTED:
        raise ApplicationWorkflowError("Only submitted applications can be marked under review.")

    application.status = ApplicationStatus.UNDER_REVIEW
    application.reviewed_at = timezone.now()
    application.save(update_fields=["status", "reviewed_at", "updated_at"])
    log_event(
        application,
        ApplicationEventType.UNDER_REVIEW,
        actor=actor,
        message="Landlord started reviewing this application.",
    )
    from apps.notifications.services.triggers import notify_application_status

    notify_application_status(
        application,
        "Under Review",
        f"Your application for {application.property.title} is being reviewed.",
    )
    return application


def approve_application(application: RentalApplication, actor, notes: str = "") -> RentalApplication:
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ApplicationWorkflowError("Only submitted or in-review applications can be approved.")

    application.status = ApplicationStatus.APPROVED
    application.reviewed_at = timezone.now()
    if notes:
        application.landlord_notes = notes
    application.save(update_fields=["status", "reviewed_at", "landlord_notes", "updated_at"])
    log_event(
        application,
        ApplicationEventType.APPROVED,
        actor=actor,
        message="Application approved by landlord.",
        metadata={"notes": notes} if notes else {},
    )
    from apps.notifications.services.triggers import notify_application_status

    notify_application_status(
        application,
        "Approved",
        f"Your application for {application.property.title} was approved. Sign your lease next.",
    )
    return application


def reject_application(
    application: RentalApplication, actor, reason: str = ""
) -> RentalApplication:
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ApplicationWorkflowError("Only submitted or in-review applications can be rejected.")

    application.status = ApplicationStatus.REJECTED
    application.reviewed_at = timezone.now()
    application.rejection_reason = reason
    application.save(
        update_fields=["status", "reviewed_at", "rejection_reason", "updated_at"]
    )
    log_event(
        application,
        ApplicationEventType.REJECTED,
        actor=actor,
        message=reason or "Application rejected by landlord.",
        metadata={"reason": reason} if reason else {},
    )
    from apps.notifications.services.triggers import notify_application_status

    notify_application_status(
        application,
        "Rejected",
        reason or f"Your application for {application.property.title} was not approved.",
    )
    return application
