import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class LeaseStatus(models.TextChoices):
    PENDING_SIGNATURE = "PENDING_SIGNATURE", "Pending Signature"
    ACTIVE = "ACTIVE", "Active"
    EXPIRING_SOON = "EXPIRING_SOON", "Expiring Soon"
    EXPIRED = "EXPIRED", "Expired"
    TERMINATED = "TERMINATED", "Terminated"


class LeaseDocumentType(models.TextChoices):
    LEASE_AGREEMENT = "LEASE_AGREEMENT", "Lease Agreement"
    ADDENDUM = "ADDENDUM", "Addendum"
    SERVICE_CONTRACT = "SERVICE_CONTRACT", "Service Contract"
    SIGNED_COPY = "SIGNED_COPY", "Signed Copy"


class SignerRole(models.TextChoices):
    TENANT = "TENANT", "Tenant"
    LANDLORD = "LANDLORD", "Landlord"


class SignatureMethod(models.TextChoices):
    ELECTRONIC = "ELECTRONIC", "Electronic"
    UPLOAD = "UPLOAD", "Uploaded PDF"


class Lease(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        "applications.RentalApplication",
        on_delete=models.PROTECT,
        related_name="lease",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leases_as_tenant",
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leases_as_landlord",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="leases",
    )
    status = models.CharField(
        max_length=20,
        choices=LeaseStatus.choices,
        default=LeaseStatus.PENDING_SIGNATURE,
        db_index=True,
    )

    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    rent_due_day = models.PositiveSmallIntegerField(default=1, help_text="Day of month rent is due")
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    duration_months = models.PositiveSmallIntegerField(default=12)
    furnished = models.BooleanField(default=False)

    start_date = models.DateField()
    end_date = models.DateField()

    signed_pdf = models.FileField(upload_to="leases/signed/", blank=True)
    tenant_signed_at = models.DateTimeField(null=True, blank=True)
    landlord_signed_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    terminated_at = models.DateTimeField(null=True, blank=True)
    termination_reason = models.TextField(blank=True, default="")

    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["landlord", "status"]),
            models.Index(fields=["end_date"]),
        ]

    def __str__(self):
        return f"Lease: {self.property.title} — {self.tenant.email} ({self.status})"


class LeaseDocument(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    doc_type = models.CharField(max_length=20, choices=LeaseDocumentType.choices)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="leases/documents/")
    is_shareable = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_lease_documents",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.doc_type})"


class LeaseAddendum(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="addendums",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    effective_date = models.DateField()
    document = models.OneToOneField(
        LeaseDocument,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="addendum",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lease_addendums",
    )

    class Meta:
        ordering = ["-effective_date"]
        verbose_name_plural = "lease addenda"

    def __str__(self):
        return f"{self.title} — {self.lease_id}"


class DigitalSignature(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="signatures",
    )
    document = models.ForeignKey(
        LeaseDocument,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signatures",
    )
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lease_signatures",
    )
    signer_role = models.CharField(max_length=10, choices=SignerRole.choices)
    signature_method = models.CharField(
        max_length=20,
        choices=SignatureMethod.choices,
        default=SignatureMethod.ELECTRONIC,
    )
    signed_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["signed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["lease", "signer_role"],
                name="unique_lease_signer_role",
            )
        ]

    def __str__(self):
        return f"{self.signer_role} signature — {self.lease_id}"
