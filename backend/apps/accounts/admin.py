from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import (
    LoginActivity,
    NotificationPreference,
    PasswordResetToken,
    RegistrationSession,
    User,
    UserProfile,
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "phone", "role", "is_phone_verified", "is_active", "created_at")
    list_filter = ("role", "is_active", "is_phone_verified", "is_email_verified")
    search_fields = ("email", "phone", "profile__full_name")
    readonly_fields = ("id", "last_login", "created_at", "updated_at", "last_login_ip", "last_login_location")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("phone", "role")}),
        (
            "Verification",
            {"fields": ("is_email_verified", "is_phone_verified", "last_login_ip", "last_login_location")},
        ),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "phone", "role", "password1", "password2", "is_staff", "is_superuser"),
            },
        ),
    )
    inlines = [UserProfileInline]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "city", "id_document_verified", "income_verified")
    search_fields = ("full_name", "user__email")


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "email_rent_reminders", "sms_rent_reminders", "push_enabled")


@admin.register(RegistrationSession)
class RegistrationSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "phone", "role", "step", "is_verified", "expires_at", "created_at")
    list_filter = ("step", "role", "is_verified")
    readonly_fields = ("id", "otp_code", "created_at", "updated_at")


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    list_display = ("user", "ip_address", "location", "success", "created_at")
    list_filter = ("success",)
    readonly_fields = ("user", "ip_address", "user_agent", "location", "success", "created_at")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "is_used", "expires_at", "created_at")
    readonly_fields = ("token", "created_at", "updated_at")
