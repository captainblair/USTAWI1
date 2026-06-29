import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class InvoiceStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    OVERDUE = "OVERDUE", "Overdue"
    CANCELLED = "CANCELLED", "Cancelled"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"


class PaymentMethod(models.TextChoices):
    MPESA = "MPESA", "M-Pesa"


class PayoutMethodType(models.TextChoices):
    MPESA_PHONE = "MPESA_PHONE", "M-Pesa Phone"
    PAYBILL = "PAYBILL", "Paybill"
    TILL = "TILL", "Till Number"


class SubscriptionPlan(models.TextChoices):
    FREE = "FREE", "Free"
    PREMIUM = "PREMIUM", "Premium"


class SubscriptionStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"


class Invoice(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        "leases.Lease",
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    invoice_number = models.CharField(max_length=32, unique=True, db_index=True)
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    due_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.PENDING,
        db_index=True,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    description = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-due_date"]
        indexes = [
            models.Index(fields=["lease", "status"]),
            models.Index(fields=["due_date", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["lease", "billing_period_start", "billing_period_end"],
                name="unique_lease_billing_period",
            )
        ]

    def __str__(self):
        return f"{self.invoice_number} — {self.amount} {self.currency}"


class Payment(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments_made",
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments_received",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.MPESA,
    )
    phone_number = models.CharField(max_length=20)

    idempotency_key = models.CharField(max_length=64, unique=True, db_index=True)
    mpesa_checkout_request_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    mpesa_merchant_request_id = models.CharField(max_length=64, blank=True, default="")
    mpesa_receipt_number = models.CharField(max_length=32, blank=True, default="", db_index=True)
    mpesa_transaction_date = models.CharField(max_length=32, blank=True, default="")
    mpesa_result_code = models.CharField(max_length=10, blank=True, default="")
    mpesa_result_desc = models.CharField(max_length=255, blank=True, default="")

    initiated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    raw_callback = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["landlord", "status"]),
        ]

    def __str__(self):
        return f"Payment {self.id} — {self.status}"


class PaymentReceipt(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(
        Payment,
        on_delete=models.CASCADE,
        related_name="receipt",
    )
    receipt_number = models.CharField(max_length=32, unique=True, db_index=True)
    receipt_file = models.FileField(upload_to="payments/receipts/", blank=True)
    emailed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.receipt_number


class PayoutMethod(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payout_methods",
    )
    method_type = models.CharField(max_length=20, choices=PayoutMethodType.choices)
    account_label = models.CharField(max_length=100, blank=True, default="")
    account_number = models.CharField(max_length=30)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.method_type} — {self.account_number}"


class LandlordSubscription(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.FREE,
    )
    status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
    )
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.landlord.email} — {self.plan} ({self.status})"
