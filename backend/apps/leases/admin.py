from django.contrib import admin

from apps.leases.models import DigitalSignature, Lease, LeaseAddendum, LeaseDocument


class LeaseDocumentInline(admin.TabularInline):
    model = LeaseDocument
    extra = 0


class DigitalSignatureInline(admin.TabularInline):
    model = DigitalSignature
    extra = 0
    readonly_fields = ("signed_at", "signer_role", "signer")


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ("property", "tenant", "landlord", "status", "rent_amount", "start_date", "end_date")
    list_filter = ("status", "furnished")
    search_fields = ("tenant__email", "landlord__email", "property__title")
    inlines = [LeaseDocumentInline, DigitalSignatureInline]


@admin.register(LeaseAddendum)
class LeaseAddendumAdmin(admin.ModelAdmin):
    list_display = ("title", "lease", "effective_date", "created_at")


@admin.register(LeaseDocument)
class LeaseDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "lease", "doc_type", "is_shareable", "created_at")


@admin.register(DigitalSignature)
class DigitalSignatureAdmin(admin.ModelAdmin):
    list_display = ("lease", "signer_role", "signer", "signed_at", "signature_method")
    readonly_fields = ("signed_at",)
