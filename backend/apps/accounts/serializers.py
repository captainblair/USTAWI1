from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import (
    LoginActivity,
    NotificationPreference,
    RegistrationSession,
    UserProfile,
    UserRole,
)
from apps.accounts.services.africas_talking import normalize_kenyan_phone

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    is_email_verified = serializers.BooleanField(source="user.is_email_verified", read_only=True)
    is_phone_verified = serializers.BooleanField(source="user.is_phone_verified", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "email",
            "phone",
            "role",
            "full_name",
            "avatar",
            "date_of_birth",
            "address",
            "city",
            "country",
            "id_document_verified",
            "income_verified",
            "is_email_verified",
            "is_phone_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id_document_verified",
            "income_verified",
            "is_email_verified",
            "is_phone_verified",
            "created_at",
            "updated_at",
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["full_name", "avatar", "date_of_birth", "address", "city", "country"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "email_rent_reminders",
            "email_application_updates",
            "email_maintenance_alerts",
            "email_payment_updates",
            "email_system_alerts",
            "sms_rent_reminders",
            "sms_application_updates",
            "sms_maintenance_alerts",
            "push_enabled",
        ]


class LoginActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginActivity
        fields = ["ip_address", "user_agent", "location", "success", "created_at"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "role",
            "is_email_verified",
            "is_phone_verified",
            "last_login",
            "profile",
            "created_at",
        ]
        read_only_fields = fields


class RegisterRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)


class RegisterProfileSerializer(serializers.Serializer):
    registration_token = serializers.UUIDField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_phone(self, value):
        try:
            normalized = normalize_kenyan_phone(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        if User.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return normalized

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def validate_registration_token(self, value):
        try:
            session = RegistrationSession.objects.get(id=value)
        except RegistrationSession.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid registration token.") from exc
        if session.is_expired:
            raise serializers.ValidationError("Registration session has expired.")
        if session.step != "ROLE":
            raise serializers.ValidationError("Invalid registration step.")
        return value


class RegisterSendOTPSerializer(serializers.Serializer):
    registration_token = serializers.UUIDField()

    def validate_registration_token(self, value):
        try:
            session = RegistrationSession.objects.get(id=value)
        except RegistrationSession.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid registration token.") from exc
        if session.is_expired:
            raise serializers.ValidationError("Registration session has expired.")
        if session.step not in ("PROFILE", "OTP_SENT"):
            raise serializers.ValidationError("Complete profile step before requesting OTP.")
        return value


class RegisterVerifyOTPSerializer(serializers.Serializer):
    registration_token = serializers.UUIDField()
    otp = serializers.CharField(min_length=4, max_length=10)

    def validate_registration_token(self, value):
        try:
            session = RegistrationSession.objects.get(id=value)
        except RegistrationSession.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid registration token.") from exc
        if session.is_expired:
            raise serializers.ValidationError("Registration session has expired.")
        if session.step != "OTP_SENT":
            raise serializers.ValidationError("Request OTP before verification.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="JWT refresh token from login response")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs
