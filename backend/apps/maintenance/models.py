import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel

MAX_PHOTOS_PER_REQUEST = 5
MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class MaintenanceCategory(models.TextChoices):
    PLUMBING = "PLUMBING", "Plumbing"
    ELECTRICAL = "ELECTRICAL", "Electrical"
    HVAC = "HVAC", "HVAC"
    APPLIANCE = "APPLIANCE", "Appliance"
    STRUCTURAL = "STRUCTURAL", "Structural"
    PEST_CONTROL = "PEST_CONTROL", "Pest Control"
    SECURITY = "SECURITY", "Security"
    OTHER = "OTHER", "Other"


class MaintenanceUrgency(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class MaintenanceStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ASSIGNED = "ASSIGNED", "Assigned"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class MaintenanceUpdateType(models.TextChoices):
    CREATED = "CREATED", "Created"
    STATUS_CHANGE = "STATUS_CHANGE", "Status Change"
    ASSIGNMENT = "ASSIGNMENT", "Assignment"
    NOTE = "NOTE", "Note"


class MaintenanceRequest(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maintenance_requests",
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="landlord_maintenance_requests",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="maintenance_requests",
    )
    lease = models.ForeignKey(
        "leases.Lease",
        on_delete=models.PROTECT,
        related_name="maintenance_requests",
    )
    unit_label = models.CharField(max_length=100, blank=True, default="")

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=MaintenanceCategory.choices)
    urgency = models.CharField(
        max_length=10,
        choices=MaintenanceUrgency.choices,
        default=MaintenanceUrgency.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.PENDING,
        db_index=True,
    )

    assigned_technician_name = models.CharField(max_length=255, blank=True, default="")
    assigned_technician_phone = models.CharField(max_length=20, blank=True, default="")
    assigned_at = models.DateTimeField(null=True, blank=True)

    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["landlord", "status"]),
            models.Index(fields=["property", "status"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.property.title} ({self.status})"


class MaintenancePhoto(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        MaintenanceRequest,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    image = models.ImageField(upload_to="maintenance/photos/")
    caption = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"Photo for {self.request_id}"


class MaintenanceUpdate(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        MaintenanceRequest,
        on_delete=models.CASCADE,
        related_name="updates",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maintenance_updates",
    )
    update_type = models.CharField(max_length=20, choices=MaintenanceUpdateType.choices)
    old_status = models.CharField(max_length=20, blank=True, default="")
    new_status = models.CharField(max_length=20, blank=True, default="")
    message = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.update_type} — {self.request_id}"
