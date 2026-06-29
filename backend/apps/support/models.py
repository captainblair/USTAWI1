import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel

MAX_ATTACHMENTS_PER_CASE = 5
MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024


class SupportCaseCategory(models.TextChoices):
    PAYMENT = "PAYMENT", "Payment & Billing"
    LEASE = "LEASE", "Lease & Contracts"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    PROPERTY = "PROPERTY", "Property Listing"
    VERIFICATION = "VERIFICATION", "Verification & Safety"
    ACCOUNT = "ACCOUNT", "Account & Profile"
    OTHER = "OTHER", "Other"


class SupportCaseStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    ESCALATED = "ESCALATED", "Escalated"
    RESOLVED = "RESOLVED", "Resolved"


class KnowledgeBaseCategory(models.TextChoices):
    GETTING_STARTED = "GETTING_STARTED", "Getting Started"
    APPLICATIONS = "APPLICATIONS", "Applications & Leasing"
    PAYMENTS = "PAYMENTS", "Payments & M-Pesa"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    VERIFICATION = "VERIFICATION", "Verification & Safety"
    ACCOUNT = "ACCOUNT", "Account & Profile"


class ChatSessionStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    CLOSED = "CLOSED", "Closed"


class SupportCase(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_number = models.CharField(max_length=20, unique=True, db_index=True)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_cases",
    )
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_support_cases",
    )
    category = models.CharField(max_length=20, choices=SupportCaseCategory.choices)
    urgency = models.PositiveSmallIntegerField(default=3, help_text="1 (low) to 5 (critical)")
    status = models.CharField(
        max_length=20,
        choices=SupportCaseStatus.choices,
        default=SupportCaseStatus.OPEN,
        db_index=True,
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_cases",
    )
    lease = models.ForeignKey(
        "leases.Lease",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_cases",
    )
    escalated_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["reporter", "status"]),
        ]

    def __str__(self):
        return f"{self.case_number} — {self.subject}"


class CaseAttachment(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        SupportCase,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="support/attachments/")
    filename = models.CharField(max_length=255, blank=True, default="")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="case_attachments",
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.filename or str(self.id)


class CaseMessage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        SupportCase,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="case_messages",
    )
    body = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Admin-only note")

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message on {self.case.case_number}"


class KnowledgeBaseArticle(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    category = models.CharField(max_length=30, choices=KnowledgeBaseCategory.choices, db_index=True)
    summary = models.CharField(max_length=500, blank=True, default="")
    content = models.TextField()
    is_published = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["category", "sort_order", "title"]
        verbose_name = "Knowledge base article"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class LiveChatSession(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_sessions",
    )
    status = models.CharField(
        max_length=10,
        choices=ChatSessionStatus.choices,
        default=ChatSessionStatus.OPEN,
    )
    subject = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Chat {self.id} — {self.user.email}"


class LiveChatMessage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        LiveChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_messages",
    )
    body = models.TextField()
    is_agent = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Chat message {self.id}"
