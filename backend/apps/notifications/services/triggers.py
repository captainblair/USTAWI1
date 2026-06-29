from apps.notifications.models import NotificationCategory
from apps.notifications.services.dispatch import send_notification


def notify_application_submitted(application):
    landlord = application.property.owner
    tenant_name = application.tenant.profile.full_name or application.tenant.email
    send_notification(
        landlord,
        NotificationCategory.APPLICATIONS,
        "New rental application",
        f"{tenant_name} applied for {application.property.title}.",
        reference_type="application",
        reference_id=application.id,
        action_path=f"/landlord/applications/{application.id}",
        event_type="application_submitted",
        actor_name=tenant_name,
        email_subject="New rental application",
        email_body=f"{tenant_name} submitted an application for {application.property.title}.",
        sms_body=f"Ustawi: New application for {application.property.title} from {tenant_name}.",
    )


def notify_application_status(application, status_label: str, message: str):
    send_notification(
        application.tenant,
        NotificationCategory.APPLICATIONS,
        f"Application {status_label}",
        message,
        reference_type="application",
        reference_id=application.id,
        action_path=f"/applications/{application.id}",
        event_type=f"application_{status_label.lower()}",
        email_subject=f"Application {status_label}",
        email_body=message,
        sms_body=f"Ustawi: Your application for {application.property.title} — {status_label}.",
    )


def notify_payment_completed(payment):
    prop_title = payment.invoice.lease.property.title
    tenant_msg = (
        f"Your rent payment of {payment.currency} {payment.amount} for {prop_title} was confirmed. "
        f"M-Pesa ref: {payment.mpesa_receipt_number}."
    )
    receipt_path = ""
    if hasattr(payment, "receipt") and payment.receipt:
        receipt_path = f"/payments/receipts/{payment.receipt.id}"
    send_notification(
        payment.tenant,
        NotificationCategory.PAYMENTS,
        "Rent payment confirmed",
        tenant_msg,
        reference_type="payment",
        reference_id=payment.id,
        action_path=receipt_path,
        event_type="payment_completed",
        email_subject="Rent payment confirmed",
        email_body=tenant_msg,
    )
    landlord_msg = (
        f"Rent of {payment.currency} {payment.amount} received from "
        f"{payment.tenant.profile.full_name or payment.tenant.email} for {prop_title}."
    )
    send_notification(
        payment.landlord,
        NotificationCategory.PAYMENTS,
        "Rent payment received",
        landlord_msg,
        reference_type="payment",
        reference_id=payment.id,
        action_path="/landlord/payments/collected",
        event_type="payment_received",
        email_subject="Rent payment received",
        email_body=landlord_msg,
    )


def notify_rent_due(invoice):
    lease = invoice.lease
    tenant = lease.tenant
    msg = (
        f"Rent of {invoice.currency} {invoice.amount} for {lease.property.title} "
        f"is due on {invoice.due_date}. Invoice: {invoice.invoice_number}."
    )
    send_notification(
        tenant,
        NotificationCategory.PAYMENTS,
        "Rent payment due",
        msg,
        reference_type="invoice",
        reference_id=invoice.id,
        action_path="/payments/pay-rent",
        event_type="rent_due",
        email_subject="Rent payment due",
        email_body=msg,
        sms_body=f"Ustawi: Rent due KES {invoice.amount} for {lease.property.title}. Pay via the app.",
    )


def notify_maintenance_created(request_obj):
    send_notification(
        request_obj.landlord,
        NotificationCategory.MAINTENANCE,
        "New maintenance request",
        f"{request_obj.title} — {request_obj.property.title} ({request_obj.urgency} urgency).",
        reference_type="maintenance",
        reference_id=request_obj.id,
        action_path=f"/landlord/maintenance/{request_obj.id}",
        event_type="maintenance_created",
        actor_name=request_obj.tenant.profile.full_name or request_obj.tenant.email,
        email_subject="New maintenance request",
        email_body=request_obj.description[:500],
        sms_body=f"Ustawi: Maintenance request at {request_obj.property.title}: {request_obj.title}.",
    )


def notify_maintenance_updated(request_obj, message: str, recipient):
    send_notification(
        recipient,
        NotificationCategory.MAINTENANCE,
        f"Maintenance update — {request_obj.title}",
        message,
        reference_type="maintenance",
        reference_id=request_obj.id,
        action_path=f"/maintenance/{request_obj.id}",
        event_type="maintenance_updated",
        email_subject="Maintenance request updated",
        email_body=message,
        sms_body=f"Ustawi: {request_obj.title} — {message[:120]}",
    )
