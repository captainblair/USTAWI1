import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class UserRole(models.TextChoices):
    TENANT = "TENANT", "Tenant"
    LANDLORD = "LANDLORD", "Landlord"
    AGENT = "AGENT", "Agent"
    INSPECTOR = "INSPECTOR", "Inspector"
    ADMIN = "ADMIN", "Admin"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_email_verified", True)
        extra_fields.setdefault("is_phone_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.TENANT)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_location = models.CharField(max_length=255, blank=True, default="")
    last_seen_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        if hasattr(self, "profile") and self.profile.full_name:
            return self.profile.full_name
        return self.email


class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="Nairobi")
    country = models.CharField(max_length=100, blank=True, default="Kenya")

    id_document_verified = models.BooleanField(default=False)
    income_verified = models.BooleanField(default=False)
    is_verified_landlord = models.BooleanField(default=False)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile: {self.full_name or self.user.email}"


class NotificationPreference(TimeStampedModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )

    email_rent_reminders = models.BooleanField(default=True)
    email_application_updates = models.BooleanField(default=True)
    email_maintenance_alerts = models.BooleanField(default=True)
    email_payment_updates = models.BooleanField(default=True)
    email_system_alerts = models.BooleanField(default=True)

    sms_rent_reminders = models.BooleanField(default=False)
    sms_application_updates = models.BooleanField(default=True)
    sms_maintenance_alerts = models.BooleanField(default=True)

    push_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"

    def __str__(self):
        return f"Notification prefs: {self.user.email}"


class RegistrationStep(models.TextChoices):
    ROLE = "ROLE", "Role Selected"
    PROFILE = "PROFILE", "Profile Completed"
    OTP_SENT = "OTP_SENT", "OTP Sent"
    COMPLETED = "COMPLETED", "Completed"


class RegistrationSession(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=UserRole.choices, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    full_name = models.CharField(max_length=255, blank=True, default="")
    password = models.CharField(max_length=128, blank=True, default="")
    step = models.CharField(
        max_length=20, choices=RegistrationStep.choices, default=RegistrationStep.ROLE
    )
    otp_code = models.CharField(max_length=10, blank=True, default="")
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveSmallIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Registration {self.id} ({self.step})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_otp_expired(self):
        return self.otp_expires_at is None or timezone.now() > self.otp_expires_at


class LoginActivity(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_activities")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    success = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Login activities"

    def __str__(self):
        status = "success" if self.success else "failed"
        return f"{self.user.email} login ({status}) at {self.created_at}"


class PasswordResetToken(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reset token for {self.user.email}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired
