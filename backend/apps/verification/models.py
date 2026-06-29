import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class VerificationCaseStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_REVIEW = "IN_REVIEW", "In Review"
    AWAITING_DOCS = "AWAITING_DOCS", "Awaiting Documents"
    REJECTED = "REJECTED", "Rejected"
    APPROVED = "APPROVED", "Approved"


class VerificationStage(models.TextChoices):
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW", "Document Review"
    ON_SITE_INSPECTION = "ON_SITE_INSPECTION", "On-site Inspection"
    SAFETY_SCORING = "SAFETY_SCORING", "Safety Scoring"
    FINAL_REVIEW = "FINAL_REVIEW", "Final Review"


class RiskLevel(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class VerificationDocType(models.TextChoices):
    TITLE_DEED = "TITLE_DEED", "Title Deed"
    TAX_INFO = "TAX_INFO", "Tax Information"
    CONTRACT = "CONTRACT", "Contract"
    ID_PASSPORT = "ID_PASSPORT", "ID / Passport"
    OTHER = "OTHER", "Other"


class DocumentReviewStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class PhotoVerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class SafetyFactorType(models.TextChoices):
    NEIGHBORHOOD = "NEIGHBORHOOD", "Neighborhood Safety"
    BUILDING_CONDITION = "BUILDING_CONDITION", "Building Condition"
    ACCESS_CONTROL = "ACCESS_CONTROL", "Access Control"
    LIGHTING = "LIGHTING", "Lighting"
    EMERGENCY_READINESS = "EMERGENCY_READINESS", "Emergency Readiness"


class CommunityReportCategory(models.TextChoices):
    SAFETY = "SAFETY", "Safety"
    UTILITIES = "UTILITIES", "Utilities"
    NOISE = "NOISE", "Noise"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    OTHER = "OTHER", "Other"


class CommunityReportStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    VERIFIED = "VERIFIED", "Verified"
    DISMISSED = "DISMISSED", "Dismissed"


class VerificationCase(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="verification_case",
    )
    status = models.CharField(
        max_length=20,
        choices=VerificationCaseStatus.choices,
        default=VerificationCaseStatus.PENDING,
        db_index=True,
    )
    stage = models.CharField(
        max_length=30,
        choices=VerificationStage.choices,
        default=VerificationStage.DOCUMENT_REVIEW,
    )
    risk_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM,
    )
    assigned_inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_verifications",
    )
    inspector_notes = models.TextField(blank=True, default="")
    rejection_reason = models.TextField(blank=True, default="")
    changes_requested = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [models.Index(fields=["status", "-submitted_at"])]

    def __str__(self):
        return f"Verification: {self.property.title} ({self.status})"


class VerificationDocument(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        VerificationCase,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    doc_type = models.CharField(max_length=20, choices=VerificationDocType.choices)
    title = models.CharField(max_length=255, blank=True, default="")
    file = models.FileField(upload_to="verification/documents/", blank=True)
    property_document = models.ForeignKey(
        "properties.PropertyDocument",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_links",
    )
    status = models.CharField(
        max_length=20,
        choices=DocumentReviewStatus.choices,
        default=DocumentReviewStatus.PENDING,
    )
    reviewer_notes = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_verification_documents",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["doc_type", "created_at"]

    def __str__(self):
        return f"{self.doc_type} — {self.case_id}"


class SafetyScore(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="safety_score_record",
    )
    case = models.ForeignKey(
        VerificationCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_scores",
    )
    overall_score = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    scored_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_scores_given",
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Safety {self.overall_score}/10 — {self.property.title}"


class SafetyScoreFactor(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    safety_score = models.ForeignKey(
        SafetyScore,
        on_delete=models.CASCADE,
        related_name="factors",
    )
    factor_type = models.CharField(max_length=30, choices=SafetyFactorType.choices)
    score = models.DecimalField(max_digits=6, decimal_places=2)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=10)
    notes = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        unique_together = [("safety_score", "factor_type")]
        ordering = ["factor_type"]

    def __str__(self):
        return f"{self.factor_type}: {self.score}/{self.max_score}"


class CommunityReport(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="community_reports",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_reports",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=CommunityReportCategory.choices,
        default=CommunityReportCategory.OTHER,
    )
    severity = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=CommunityReportStatus.choices,
        default=CommunityReportStatus.PENDING,
    )
    is_public = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["property", "status"])]

    def __str__(self):
        return f"{self.title} — {self.property.title}"


class AuditLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        VerificationCase,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="verification_audit_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_audit_logs",
    )
    action = models.CharField(max_length=50, db_index=True)
    message = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} — {self.created_at}"
