from django.contrib import admin

from apps.payments.models import Invoice, LandlordSubscription, Payment, PaymentReceipt, PayoutMethod


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "lease", "amount", "due_date", "status", "paid_at")
    list_filter = ("status",)
    search_fields = ("invoice_number", "lease__property__title")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "tenant",
        "amount",
        "status",
        "mpesa_receipt_number",
        "completed_at",
    )
    list_filter = ("status",)
    search_fields = ("mpesa_receipt_number", "mpesa_checkout_request_id", "tenant__email")
    readonly_fields = ("raw_callback",)


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "payment", "emailed_at", "created_at")


@admin.register(PayoutMethod)
class PayoutMethodAdmin(admin.ModelAdmin):
    list_display = ("landlord", "method_type", "account_number", "is_default")


@admin.register(LandlordSubscription)
class LandlordSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("landlord", "plan", "status", "monthly_fee", "expires_at")
