from django.contrib import admin

from apps.applications.models import (
    ApplicationDocument,
    ApplicationEvent,
    ApplicationReference,
    RentalApplication,
)


class ApplicationReferenceInline(admin.TabularInline):
    model = ApplicationReference
    extra = 0


class ApplicationDocumentInline(admin.TabularInline):
    model = ApplicationDocument
    extra = 0


class ApplicationEventInline(admin.TabularInline):
    model = ApplicationEvent
    extra = 0
    readonly_fields = ("event_type", "actor", "message", "metadata", "created_at")


@admin.register(RentalApplication)
class RentalApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "tenant",
        "property",
        "status",
        "screening_score",
        "screening_label",
        "submitted_at",
    )
    list_filter = ("status", "screening_label")
    search_fields = ("tenant__email", "property__title")
    inlines = [ApplicationReferenceInline, ApplicationDocumentInline, ApplicationEventInline]
    readonly_fields = ("screening_score", "screening_label", "income_rent_ratio", "submitted_at", "reviewed_at")
