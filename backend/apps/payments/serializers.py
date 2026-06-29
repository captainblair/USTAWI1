from rest_framework import serializers

from apps.payments.models import (
    Invoice,
    LandlordSubscription,
    Payment,
    PaymentReceipt,
    PayoutMethod,
    PayoutMethodType,
    SubscriptionPlan,
)


class InvoiceListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="lease.property.title", read_only=True)
    lease_id = serializers.UUIDField(source="lease.id", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "lease_id",
            "property_title",
            "invoice_number",
            "amount",
            "currency",
            "due_date",
            "status",
            "billing_period_start",
            "billing_period_end",
            "description",
            "paid_at",
            "created_at",
        ]


class PaymentHistorySerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)
    property_title = serializers.CharField(source="invoice.lease.property.title", read_only=True)
    receipt_number = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice_number",
            "property_title",
            "amount",
            "currency",
            "status",
            "payment_method",
            "phone_number",
            "mpesa_receipt_number",
            "mpesa_transaction_date",
            "completed_at",
            "receipt_number",
            "created_at",
        ]

    def get_receipt_number(self, obj):
        if hasattr(obj, "receipt"):
            return obj.receipt.receipt_number
        return None


class PaymentReceiptSerializer(serializers.ModelSerializer):
    payment_amount = serializers.DecimalField(
        source="payment.amount", max_digits=12, decimal_places=2, read_only=True
    )
    payment_currency = serializers.CharField(source="payment.currency", read_only=True)
    mpesa_receipt_number = serializers.CharField(source="payment.mpesa_receipt_number", read_only=True)
    invoice_number = serializers.CharField(source="payment.invoice.invoice_number", read_only=True)
    completed_at = serializers.DateTimeField(source="payment.completed_at", read_only=True)
    receipt_file_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentReceipt
        fields = [
            "id",
            "receipt_number",
            "invoice_number",
            "payment_amount",
            "payment_currency",
            "mpesa_receipt_number",
            "completed_at",
            "receipt_file_url",
            "emailed_at",
            "created_at",
        ]

    def get_receipt_file_url(self, obj):
        if not obj.receipt_file:
            return None
        request = self.context.get("request")
        url = obj.receipt_file.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class InitiateRentPaymentSerializer(serializers.Serializer):
    lease_id = serializers.UUIDField()
    phone = serializers.CharField(required=False, allow_blank=True)


class LandlordPaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.profile.full_name", read_only=True)
    property_title = serializers.CharField(source="invoice.lease.property.title", read_only=True)
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "tenant_name",
            "property_title",
            "invoice_number",
            "amount",
            "currency",
            "status",
            "mpesa_receipt_number",
            "completed_at",
            "created_at",
        ]


class LandlordIncomeSummarySerializer(serializers.Serializer):
    month = serializers.CharField()
    total_collected = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency = serializers.CharField()
    payment_count = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()


class PayoutMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutMethod
        fields = [
            "id",
            "method_type",
            "account_label",
            "account_number",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PayoutMethodCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutMethod
        fields = ["method_type", "account_label", "account_number", "is_default"]

    def validate_method_type(self, value):
        if value not in PayoutMethodType.values:
            raise serializers.ValidationError("Invalid payout method type.")
        return value


class LandlordSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandlordSubscription
        fields = [
            "id",
            "plan",
            "status",
            "monthly_fee",
            "started_at",
            "expires_at",
            "notes",
        ]
        read_only_fields = fields


class DevSimulateCallbackSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField()
    success = serializers.BooleanField(default=True)
