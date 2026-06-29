from django.contrib import admin

from apps.verification.models import (
    AuditLog,
    CommunityReport,
    SafetyScore,
    SafetyScoreFactor,
    VerificationCase,
    VerificationDocument,
)


class VerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    extra = 0


class AuditLogInline(admin.TabularInline):
    model = AuditLog
    extra = 0
    readonly_fields = ("action", "actor", "message", "metadata", "created_at")


@admin.register(VerificationCase)
class VerificationCaseAdmin(admin.ModelAdmin):
    list_display = ("property", "status", "stage", "risk_level", "assigned_inspector", "submitted_at")
    list_filter = ("status", "stage", "risk_level")
    search_fields = ("property__title",)
    inlines = [VerificationDocumentInline, AuditLogInline]


@admin.register(CommunityReport)
class CommunityReportAdmin(admin.ModelAdmin):
    list_display = ("title", "property", "category", "severity", "status", "created_at")
    list_filter = ("status", "category", "severity")
    actions = ["mark_verified"]

    @admin.action(description="Mark selected reports as verified/public")
    def mark_verified(self, request, queryset):
        queryset.update(status="VERIFIED", is_public=True)


@admin.register(SafetyScore)
class SafetyScoreAdmin(admin.ModelAdmin):
    list_display = ("property", "overall_score", "scored_by", "updated_at")


admin.site.register(SafetyScoreFactor)
admin.site.register(VerificationDocument)
admin.site.register(AuditLog)
