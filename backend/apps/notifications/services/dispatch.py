from django.utils import timezone

from apps.notifications.models import ActivityEvent, Notification, NotificationCategory


def send_notification(
    user,
    category: str,
    title: str,
    message: str,
    *,
    reference_type: str = "",
    reference_id=None,
    action_path: str = "",
    metadata=None,
    event_type: str = "",
    actor_name: str = "",
    email_subject: str = "",
    email_body: str = "",
    sms_body: str = "",
):
    notification = Notification.objects.create(
        user=user,
        category=category,
        title=title,
        message=message,
        reference_type=reference_type,
        reference_id=reference_id,
        action_path=action_path,
        metadata=metadata or {},
    )

    ActivityEvent.objects.create(
        user=user,
        category=category,
        event_type=event_type or category.lower(),
        title=title,
        description=message,
        reference_type=reference_type,
        reference_id=reference_id,
        actor_name=actor_name,
        metadata=metadata or {},
    )

    from apps.notifications.tasks import deliver_notification_channels_task

    deliver_notification_channels_task.delay(
        str(user.id),
        category,
        email_subject or title,
        email_body or message,
        sms_body or "",
    )

    return notification


def get_badge_counts(user) -> dict:
    from django.db.models import Count

    qs = (
        Notification.objects.filter(user=user, is_read=False)
        .values("category")
        .annotate(count=Count("id"))
    )
    by_category = {row["category"]: row["count"] for row in qs}
    total = sum(by_category.values())
    return {
        "total": total,
        "applications": by_category.get(NotificationCategory.APPLICATIONS, 0),
        "payments": by_category.get(NotificationCategory.PAYMENTS, 0),
        "maintenance": by_category.get(NotificationCategory.MAINTENANCE, 0),
        "system": by_category.get(NotificationCategory.SYSTEM, 0),
        "by_category": [
            {"category": cat, "count": by_category.get(cat, 0)}
            for cat in NotificationCategory.values
        ],
    }


def mark_notification_read(notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return notification


def mark_all_read(user) -> int:
    return Notification.objects.filter(user=user, is_read=False).update(
        is_read=True,
        read_at=timezone.now(),
    )
