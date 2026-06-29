from rest_framework import serializers

from apps.leases.models import (
    DigitalSignature,
    Lease,
    LeaseAddendum,
    LeaseDocument,
    LeaseDocumentType,
    SignerRole,
)
from apps.leases.services.workflow import get_renewal_reminder, refresh_lease_status


class LeaseDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaseDocument
        fields = [
            "id",
            "doc_type",
            "title",
            "file_url",
            "is_shareable",
            "uploaded_by_name",
            "created_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        url = obj.file.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None
        return obj.uploaded_by.profile.full_name or obj.uploaded_by.email


class DigitalSignatureSerializer(serializers.ModelSerializer):
    signer_name = serializers.SerializerMethodField()

    class Meta:
        model = DigitalSignature
        fields = [
            "id",
            "signer_role",
            "signer_name",
            "signature_method",
            "signed_at",
        ]

    def get_signer_name(self, obj):
        return obj.signer.profile.full_name or obj.signer.email


class LeaseAddendumSerializer(serializers.ModelSerializer):
    document = LeaseDocumentSerializer(read_only=True)

    class Meta:
        model = LeaseAddendum
        fields = ["id", "title", "description", "effective_date", "document", "created_at"]


class LeaseListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_address = serializers.CharField(source="property.address", read_only=True)
    counterparty_name = serializers.SerializerMethodField()
    effective_status = serializers.SerializerMethodField()
    renewal_reminder = serializers.SerializerMethodField()
    signature_status = serializers.SerializerMethodField()
    rent_due = serializers.SerializerMethodField()

    class Meta:
        model = Lease
        fields = [
            "id",
            "property_title",
            "property_address",
            "counterparty_name",
            "status",
            "effective_status",
            "rent_amount",
            "currency",
            "rent_due_day",
            "furnished",
            "start_date",
            "end_date",
            "duration_months",
            "signature_status",
            "renewal_reminder",
            "rent_due",
            "created_at",
        ]

    def get_counterparty_name(self, obj):
        request = self.context.get("request")
        if request and request.user.id == obj.tenant_id:
            return obj.landlord.profile.full_name or obj.landlord.email
        return obj.tenant.profile.full_name or obj.tenant.email

    def get_effective_status(self, obj):
        refreshed = refresh_lease_status(obj)
        return refreshed.status

    def get_renewal_reminder(self, obj):
        return get_renewal_reminder(obj)

    def get_signature_status(self, obj):
        return {
            "tenant_signed": bool(obj.tenant_signed_at),
            "landlord_signed": bool(obj.landlord_signed_at),
            "tenant_signed_at": obj.tenant_signed_at,
            "landlord_signed_at": obj.landlord_signed_at,
        }

    def get_rent_due(self, obj):
        from apps.payments.services.invoice import get_rent_due_summary

        return get_rent_due_summary(obj)


class LeaseDetailSerializer(LeaseListSerializer):
    documents = serializers.SerializerMethodField()
    addendums = LeaseAddendumSerializer(many=True, read_only=True)
    signatures = DigitalSignatureSerializer(many=True, read_only=True)
    signed_pdf_url = serializers.SerializerMethodField()
    property_id = serializers.UUIDField(source="property.id", read_only=True)
    tenant_name = serializers.CharField(source="tenant.profile.full_name", read_only=True)
    landlord_name = serializers.CharField(source="landlord.profile.full_name", read_only=True)
    application_id = serializers.UUIDField(source="application.id", read_only=True)
    deposit_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField()
    termination_reason = serializers.CharField()

    class Meta(LeaseListSerializer.Meta):
        fields = LeaseListSerializer.Meta.fields + [
            "property_id",
            "application_id",
            "tenant_name",
            "landlord_name",
            "deposit_amount",
            "notes",
            "termination_reason",
            "activated_at",
            "terminated_at",
            "signed_pdf_url",
            "documents",
            "addendums",
            "signatures",
        ]

    def get_documents(self, obj):
        docs = obj.documents.all()
        return LeaseDocumentSerializer(docs, many=True, context=self.context).data

    def get_signed_pdf_url(self, obj):
        if not obj.signed_pdf:
            return None
        request = self.context.get("request")
        url = obj.signed_pdf.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class CreateLeaseFromApplicationSerializer(serializers.Serializer):
    duration_months = serializers.IntegerField(min_value=1, max_value=60, default=12, required=False)
    rent_due_day = serializers.IntegerField(min_value=1, max_value=28, default=1, required=False)
    deposit_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=0, required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class LeaseSignSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=SignerRole.choices)


class LeaseTerminateSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class LeaseDocumentUploadSerializer(serializers.Serializer):
    doc_type = serializers.ChoiceField(choices=LeaseDocumentType.choices)
    title = serializers.CharField(max_length=255)
    file = serializers.FileField()
    is_shareable = serializers.BooleanField(default=True, required=False)


class LeaseAddendumCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    effective_date = serializers.DateField()
    file = serializers.FileField()
