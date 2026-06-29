from apps.accounts.models import NotificationPreference
from apps.accounts.services.africas_talking import AfricasTalkingSMSService
from apps.notifications.models import NotificationCategory
from django.conf import settings
from django.core.mail import send_mail


def should_send_email(prefs: NotificationPreference, category: str) -> bool:
    mapping = {
        NotificationCategory.APPLICATIONS: prefs.email_application_updates,
        NotificationCategory.PAYMENTS: prefs.email_rent_reminders or getattr(
            prefs, "email_payment_updates", True
        ),
        NotificationCategory.MAINTENANCE: prefs.email_maintenance_alerts,
        NotificationCategory.SYSTEM: getattr(prefs, "email_system_alerts", True),
    }
    return mapping.get(category, True)


def should_send_sms(prefs: NotificationPreference, category: str) -> bool:
    mapping = {
        NotificationCategory.APPLICATIONS: prefs.sms_application_updates,
        NotificationCategory.PAYMENTS: prefs.sms_rent_reminders,
        NotificationCategory.MAINTENANCE: prefs.sms_maintenance_alerts,
        NotificationCategory.SYSTEM: False,
    }
    return mapping.get(category, False)


def deliver_email(user, subject: str, body: str):
    if not user.email:
        return
    send_mail(
        subject=f"Ustawi — {subject}",
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def deliver_sms(user, body: str):
    if not user.phone or not body:
        return
    AfricasTalkingSMSService().send_sms(user.phone, body)


def deliver_channels(user, category: str, email_subject: str, email_body: str, sms_body: str):
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    if not prefs.push_enabled:
        pass  # in-app already created; push_enabled reserved for mobile push

    if email_subject and email_body and should_send_email(prefs, category):
        deliver_email(user, email_subject, email_body)

    if sms_body and should_send_sms(prefs, category):
        deliver_sms(user, sms_body)
