import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from core.models import TimeStampedModel


class ApplicationStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    WITHDRAWN = "WITHDRAWN", "Withdrawn"


ACTIVE_STATUSES = (
    ApplicationStatus.DRAFT,
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.APPROVED,
)


class ApplicationDocumentType(models.TextChoices):
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    PAYSLIP = "PAYSLIP", "Payslip"
    BANK_STATEMENT = "BANK_STATEMENT", "Bank Statement"
    EMPLOYMENT_LETTER = "EMPLOYMENT_LETTER", "Employment Letter"
    REFERENCE_LETTER = "REFERENCE_LETTER", "Reference Letter"
    OTHER = "OTHER", "Other"


class ApplicationEventType(models.TextChoices):
    CREATED = "CREATED", "Created"
    UPDATED = "UPDATED", "Updated"
    SUBMITTED = "SUBMITTED", "Submitted"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED", "Document Uploaded"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    WITHDRAWN = "WITHDRAWN", "Withdrawn"
    NOTE = "NOTE", "Note"


class RentalApplication(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rental_applications",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT,
        db_index=True,
    )

    move_in_date = models.DateField(null=True, blank=True)
    cover_letter = models.TextField(blank=True, default="")

    employment_title = models.CharField(max_length=255, blank=True, default="")
    employer = models.CharField(max_length=255, blank=True, default="")
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    screening_score = models.PositiveSmallIntegerField(default=0)
    screening_label = models.CharField(max_length=100, blank=True, default="")
    income_rent_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    landlord_notes = models.TextField(blank=True, default="")
    rejection_reason = models.TextField(blank=True, default="")

    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["-screening_score"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "property"],
                condition=Q(
                    status__in=[
                        ApplicationStatus.DRAFT,
                        ApplicationStatus.SUBMITTED,
                        ApplicationStatus.UNDER_REVIEW,
                        ApplicationStatus.APPROVED,
                    ]
                ),
                name="unique_active_application_per_tenant_property",
            )
        ]

    def __str__(self):
        return f"{self.tenant.email} → {self.property.title} ({self.status})"


class ApplicationReference(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        RentalApplication,
        on_delete=models.CASCADE,
        related_name="references",
    )
    name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.name} ({self.application_id})"


class ApplicationDocument(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        RentalApplication,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=255, blank=True, default="")
    document = models.FileField(upload_to="applications/documents/")
    doc_type = models.CharField(
        max_length=30,
        choices=ApplicationDocumentType.choices,
        default=ApplicationDocumentType.OTHER,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or self.doc_type


class ApplicationEvent(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        RentalApplication,
        on_delete=models.CASCADE,
        related_name="events",
    )
    event_type = models.CharField(max_length=30, choices=ApplicationEventType.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_events",
    )
    message = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.event_type} — {self.application_id}"
