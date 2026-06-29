import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class NotificationCategory(models.TextChoices):
    APPLICATIONS = "APPLICATIONS", "Applications"
    PAYMENTS = "PAYMENTS", "Payments"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    SYSTEM = "SYSTEM", "System"


class Notification(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    category = models.CharField(max_length=20, choices=NotificationCategory.choices, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True)
    action_path = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
            models.Index(fields=["user", "category", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.user.email}"


class ActivityEvent(TimeStampedModel):
    """Denormalized feed item for dashboard activity widgets."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_events",
    )
    category = models.CharField(max_length=20, choices=NotificationCategory.choices, db_index=True)
    event_type = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True)
    actor_name = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.event_type} — {self.user.email}"
