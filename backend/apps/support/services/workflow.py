import secrets

from django.utils import timezone

from apps.support.models import (
    CaseAttachment,
    CaseMessage,
    MAX_ATTACHMENTS_PER_CASE,
    SupportCase,
    SupportCaseStatus,
)


class SupportWorkflowError(Exception):
    pass


def _generate_case_number() -> str:
    return f"SUP-{timezone.now().strftime('%Y%m')}-{secrets.token_hex(3).upper()}"


def create_support_case(reporter, data: dict, files=None) -> SupportCase:
    case = SupportCase.objects.create(
        case_number=_generate_case_number(),
        reporter=reporter,
        category=data["category"],
        urgency=data.get("urgency", 3),
        subject=data["subject"],
        description=data["description"],
        property_id=data.get("property_id"),
        lease_id=data.get("lease_id"),
        status=SupportCaseStatus.OPEN,
    )

    CaseMessage.objects.create(
        case=case,
        sender=reporter,
        body=data["description"],
    )

    if files:
        validate_attachments(case, len(files))
        for f in files:
            CaseAttachment.objects.create(
                case=case,
                file=f,
                filename=getattr(f, "name", ""),
                uploaded_by=reporter,
            )

    from apps.notifications.models import NotificationCategory
    from apps.notifications.services.dispatch import send_notification

    send_notification(
        reporter,
        NotificationCategory.SYSTEM,
        "Support case opened",
        f"Case {case.case_number} has been submitted. We will review it shortly.",
        reference_type="support_case",
        reference_id=case.id,
        action_path=f"/support/cases/{case.id}",
        event_type="support_case_created",
    )

    return case


def validate_attachments(case: SupportCase, new_count: int = 1):
    current = case.attachments.count()
    if current + new_count > MAX_ATTACHMENTS_PER_CASE:
        raise SupportWorkflowError(f"Maximum {MAX_ATTACHMENTS_PER_CASE} attachments per case.")


def add_case_message(case: SupportCase, sender, body: str, is_internal: bool = False) -> CaseMessage:
    if case.status == SupportCaseStatus.RESOLVED and not is_internal:
        raise SupportWorkflowError("Cannot add messages to a resolved case.")

    return CaseMessage.objects.create(
        case=case,
        sender=sender,
        body=body,
        is_internal=is_internal,
    )


def update_case_status(
    case: SupportCase,
    actor,
    new_status: str,
    resolution_notes: str = "",
    assign_admin=None,
) -> SupportCase:
    if new_status == case.status:
        return case

    case.status = new_status
    if new_status == SupportCaseStatus.ESCALATED:
        case.escalated_at = timezone.now()
    elif new_status == SupportCaseStatus.RESOLVED:
        case.resolved_at = timezone.now()
        case.resolution_notes = resolution_notes or case.resolution_notes

    if assign_admin:
        case.assigned_admin = assign_admin
    elif actor and getattr(actor, "role", "") == "ADMIN":
        case.assigned_admin = case.assigned_admin or actor

    case.save()

    from apps.notifications.models import NotificationCategory
    from apps.notifications.services.dispatch import send_notification

    send_notification(
        case.reporter,
        NotificationCategory.SYSTEM,
        f"Support case {case.case_number} updated",
        f"Your case status is now: {case.get_status_display()}.",
        reference_type="support_case",
        reference_id=case.id,
        action_path=f"/support/cases/{case.id}",
        event_type="support_case_updated",
    )

    return case
