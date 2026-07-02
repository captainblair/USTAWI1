from datetime import timedelta

from django.utils import timezone

from apps.accounts.models import User

ONLINE_THRESHOLD = timedelta(minutes=10)
TOUCH_INTERVAL = timedelta(minutes=2)


def touch_last_seen(user: User) -> None:
    """Update last_seen_at, throttled to avoid a DB write on every API call."""
    now = timezone.now()
    if user.last_seen_at and (now - user.last_seen_at) < TOUCH_INTERVAL:
        return
    User.objects.filter(pk=user.pk).update(last_seen_at=now)
    user.last_seen_at = now


def reference_activity_at(user: User):
    return user.last_seen_at or user.last_login


def is_user_online(user: User) -> bool:
    reference = reference_activity_at(user)
    if not reference:
        return False
    return (timezone.now() - reference) < ONLINE_THRESHOLD
