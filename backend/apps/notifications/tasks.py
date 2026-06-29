from celery import shared_task


@shared_task
def deliver_notification_channels_task(user_id, category, email_subject, email_body, sms_body):
    from apps.accounts.models import User
    from apps.notifications.services.channels import deliver_channels

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return
    deliver_channels(user, category, email_subject, email_body, sms_body)
