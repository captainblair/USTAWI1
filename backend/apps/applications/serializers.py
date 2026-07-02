from django.db import IntegrityError
from rest_framework import serializers

from apps.applications.models import (
    ApplicationDocument,
    ApplicationDocumentType,
    ApplicationEvent,
    ApplicationReference,
    ApplicationStatus,
    RentalApplication,
)
from apps.applications.services.screening import calculate_screening
from apps.properties.models import Property, PropertyStatus
from apps.properties.serializers import PropertyListSerializer


class ApplicationReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationReference
        fields = ["id", "name", "relationship", "phone", "email", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ["id", "title", "document", "doc_type", "created_at"]
        read_only_fields = ["id", "created_at"]


class ApplicationEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "event_type",
            "actor_name",
            "message",
            "metadata",
            "created_at",
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        profile = getattr(obj.actor, "profile", None)
        return (getattr(profile, "full_name", None) or "").strip() or obj.actor.email


class ApplicationListSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    tenant_name = serializers.CharField(source="tenant.profile.full_name", read_only=True)

    class Meta:
        model = RentalApplication
        fields = [
            "id",
            "property",
            "tenant_name",
            "status",
            "move_in_date",
            "monthly_income",
            "screening_score",
            "screening_label",
            "submitted_at",
            "created_at",
        ]


class ApplicationCreateSerializer(serializers.ModelSerializer):
    property_id = serializers.UUIDField(write_only=True)
    references = ApplicationReferenceSerializer(many=True, required=False)
    submit = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = RentalApplication
        fields = [
            "property_id",
            "move_in_date",
            "cover_letter",
            "employment_title",
            "employer",
            "monthly_income",
            "references",
            "submit",
        ]

    def validate_property_id(self, value):
        try:
            prop = Property.objects.get(pk=value)
        except Property.DoesNotExist as exc:
            raise serializers.ValidationError("Property not found.") from exc
        if prop.status == PropertyStatus.OCCUPIED:
            raise serializers.ValidationError("This property is currently occupied and not accepting applications.")
        if prop.status != PropertyStatus.ACTIVE:
            raise serializers.ValidationError("This property is not accepting applications.")
        return value

    def validate(self, attrs):
        tenant = self.context["request"].user
        property_id = attrs["property_id"]
        if RentalApplication.objects.filter(
            tenant=tenant,
            property_id=property_id,
            status__in=[
                ApplicationStatus.DRAFT,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.UNDER_REVIEW,
                ApplicationStatus.APPROVED,
            ],
        ).exists():
            raise serializers.ValidationError(
                {"property_id": "You already have an active application for this property."}
            )
        return attrs

    def create(self, validated_data):
        from apps.applications.models import ApplicationEventType
        from apps.applications.services.screening import log_event
        from apps.applications.services.workflow import ApplicationWorkflowError, submit_application

        references_data = validated_data.pop("references", [])
        submit_flag = validated_data.pop("submit", False)
        property_id = validated_data.pop("property_id")
        tenant = self.context["request"].user

        try:
            application = RentalApplication.objects.create(
                tenant=tenant,
                property_id=property_id,
                **validated_data,
            )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"property_id": "You already have an active application for this property."}
            ) from exc

        for ref in references_data:
            ApplicationReference.objects.create(application=application, **ref)

        log_event(
            application,
            ApplicationEventType.CREATED,
            actor=tenant,
            message="Application created.",
        )

        if submit_flag:
            try:
                submit_application(application, actor=tenant)
            except ApplicationWorkflowError as exc:
                raise serializers.ValidationError({"submit": str(exc)}) from exc

        return application


class ApplicationUpdateSerializer(serializers.ModelSerializer):
    references = ApplicationReferenceSerializer(many=True, required=False)

    class Meta:
        model = RentalApplication
        fields = [
            "move_in_date",
            "cover_letter",
            "employment_title",
            "employer",
            "monthly_income",
            "references",
        ]

    def update(self, instance, validated_data):
        from apps.applications.models import ApplicationEventType
        from apps.applications.services.screening import log_event

        references_data = validated_data.pop("references", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if references_data is not None:
            instance.references.all().delete()
            for ref in references_data:
                ApplicationReference.objects.create(application=instance, **ref)

        log_event(
            instance,
            ApplicationEventType.UPDATED,
            actor=self.context["request"].user,
            message="Application details updated.",
        )
        return instance


class VerificationTabSerializer(serializers.Serializer):
    screening_score = serializers.IntegerField()
    screening_label = serializers.CharField()
    risk_level = serializers.CharField()
    income_rent_ratio = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    income_vs_rent_summary = serializers.CharField()
    verified_id = serializers.BooleanField()
    verified_income = serializers.BooleanField()
    verified_phone = serializers.BooleanField()
    employment_title = serializers.CharField()
    employer = serializers.CharField()
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    documents = ApplicationDocumentSerializer(many=True)


class SummaryTabSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    status = serializers.CharField()
    tenant_name = serializers.CharField()
    tenant_email = serializers.EmailField()
    property_title = serializers.CharField()
    property_location = serializers.CharField()
    move_in_date = serializers.DateField(allow_null=True)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    cover_letter = serializers.CharField()
    screening_score = serializers.IntegerField()
    screening_label = serializers.CharField()
    submitted_at = serializers.DateTimeField(allow_null=True)


class ApplicationDetailSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    summary = serializers.SerializerMethodField()
    verification = serializers.SerializerMethodField()
    references = ApplicationReferenceSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()

    class Meta:
        model = RentalApplication
        fields = [
            "id",
            "status",
            "property",
            "summary",
            "verification",
            "references",
            "timeline",
            "rejection_reason",
            "landlord_notes",
            "created_at",
            "updated_at",
        ]

    def get_summary(self, obj):
        prop = obj.property
        location = prop.neighborhood.name if prop.neighborhood else prop.city
        return SummaryTabSerializer(
            {
                "id": obj.id,
                "status": obj.status,
                "tenant_name": obj.tenant.profile.full_name or obj.tenant.email,
                "tenant_email": obj.tenant.email,
                "property_title": prop.title,
                "property_location": f"{location}, {prop.city}",
                "move_in_date": obj.move_in_date,
                "monthly_income": obj.monthly_income,
                "cover_letter": obj.cover_letter,
                "screening_score": obj.screening_score,
                "screening_label": obj.screening_label,
                "submitted_at": obj.submitted_at,
            }
        ).data

    def get_verification(self, obj):
        screening = calculate_screening(obj)
        profile = obj.tenant.profile
        return VerificationTabSerializer(
            {
                **screening,
                "verified_id": profile.id_document_verified,
                "verified_income": profile.income_verified,
                "verified_phone": obj.tenant.is_phone_verified,
                "employment_title": obj.employment_title,
                "employer": obj.employer,
                "monthly_income": obj.monthly_income,
                "documents": obj.documents.all(),
            }
        ).data

    def get_timeline(self, obj):
        return ApplicationEventSerializer(obj.events.all(), many=True).data


class LandlordInboxSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.profile.full_name", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True)
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_location = serializers.SerializerMethodField()
    verified_id = serializers.BooleanField(source="tenant.profile.id_document_verified", read_only=True)
    verified_income = serializers.BooleanField(source="tenant.profile.income_verified", read_only=True)

    class Meta:
        model = RentalApplication
        fields = [
            "id",
            "tenant_name",
            "tenant_email",
            "property_title",
            "property_location",
            "status",
            "move_in_date",
            "monthly_income",
            "screening_score",
            "screening_label",
            "income_rent_ratio",
            "verified_id",
            "verified_income",
            "submitted_at",
            "created_at",
        ]

    def get_property_location(self, obj):
        prop = obj.property
        hood = prop.neighborhood.name if prop.neighborhood else ""
        return f"{hood}, {prop.city}".strip(", ")


class ApplicationDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ["title", "document", "doc_type"]

    def validate_doc_type(self, value):
        if value not in dict(ApplicationDocumentType.choices):
            raise serializers.ValidationError("Invalid document type.")
        return value

    def create(self, validated_data):
        from apps.applications.models import ApplicationEventType
        from apps.applications.services.screening import apply_screening, log_event

        application = self.context["application"]
        doc = ApplicationDocument.objects.create(application=application, **validated_data)
        log_event(
            application,
            ApplicationEventType.DOCUMENT_UPLOADED,
            actor=self.context["request"].user,
            message=f"Document uploaded: {doc.title or doc.doc_type}",
        )
        if application.status != ApplicationStatus.DRAFT:
            apply_screening(application)
        return doc


class RejectApplicationSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class ApproveApplicationSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default="")
