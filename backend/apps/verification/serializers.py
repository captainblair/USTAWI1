from rest_framework import serializers

from apps.properties.models import PropertyImage
from apps.verification.models import (
    AuditLog,
    CommunityReport,
    DocumentReviewStatus,
    PhotoVerificationStatus,
    SafetyFactorType,
    SafetyScore,
    SafetyScoreFactor,
    VerificationCase,
    VerificationDocument,
)


class VerificationDocumentSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VerificationDocument
        fields = [
            "id",
            "doc_type",
            "title",
            "file",
            "status",
            "reviewer_notes",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
        ]

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        return obj.reviewed_by.profile.full_name or obj.reviewed_by.email


class PropertyPhotoVerificationSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = [
            "id",
            "image_url",
            "caption",
            "verification_status",
            "verification_notes",
            "sort_order",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class SafetyScoreFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyScoreFactor
        fields = ["factor_type", "score", "max_score", "notes"]


class SafetyScoreSerializer(serializers.ModelSerializer):
    factors = SafetyScoreFactorSerializer(many=True, read_only=True)

    class Meta:
        model = SafetyScore
        fields = ["overall_score", "notes", "factors", "updated_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "action", "actor_name", "message", "metadata", "created_at"]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        return obj.actor.profile.full_name or obj.actor.email


class VerificationCaseListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_location = serializers.SerializerMethodField()
    property_id = serializers.UUIDField(source="property.id", read_only=True)
    owner_name = serializers.CharField(source="property.owner.profile.full_name", read_only=True)
    safety_score = serializers.DecimalField(
        source="property.safety_score", max_digits=3, decimal_places=1, read_only=True
    )

    class Meta:
        model = VerificationCase
        fields = [
            "id",
            "property_id",
            "property_title",
            "property_location",
            "owner_name",
            "status",
            "stage",
            "risk_level",
            "safety_score",
            "submitted_at",
            "assigned_inspector",
        ]

    def get_property_location(self, obj):
        prop = obj.property
        hood = prop.neighborhood.name if prop.neighborhood else ""
        return f"{hood}, {prop.city}".strip(", ")


class VerificationCaseDetailSerializer(VerificationCaseListSerializer):
    documents = VerificationDocumentSerializer(many=True, read_only=True)
    photos = serializers.SerializerMethodField()
    safety_score_detail = serializers.SerializerMethodField()
    audit_trail = serializers.SerializerMethodField()
    inspector_notes = serializers.CharField()
    rejection_reason = serializers.CharField()
    changes_requested = serializers.CharField()

    class Meta(VerificationCaseListSerializer.Meta):
        fields = VerificationCaseListSerializer.Meta.fields + [
            "documents",
            "photos",
            "safety_score_detail",
            "audit_trail",
            "inspector_notes",
            "rejection_reason",
            "changes_requested",
            "completed_at",
        ]

    def get_photos(self, obj):
        images = obj.property.images.all()
        return PropertyPhotoVerificationSerializer(
            images, many=True, context=self.context
        ).data

    def get_safety_score_detail(self, obj):
        record = getattr(obj.property, "safety_score_record", None)
        if not record:
            return None
        return SafetyScoreSerializer(record).data

    def get_audit_trail(self, obj):
        return AuditLogSerializer(obj.audit_logs.all()[:50], many=True).data


class SafetyScoreSubmitSerializer(serializers.Serializer):
    neighborhood = serializers.DecimalField(max_digits=4, decimal_places=1, min_value=0, max_value=10)
    building_condition = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=0, max_value=100)
    access_control = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=0, max_value=100)
    lighting = serializers.DecimalField(max_digits=4, decimal_places=1, min_value=0, max_value=10)
    emergency_readiness = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=0, max_value=100)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def to_factor_dict(self):
        data = self.validated_data
        return {
            SafetyFactorType.NEIGHBORHOOD: data["neighborhood"],
            SafetyFactorType.BUILDING_CONDITION: data["building_condition"],
            SafetyFactorType.ACCESS_CONTROL: data["access_control"],
            SafetyFactorType.LIGHTING: data["lighting"],
            SafetyFactorType.EMERGENCY_READINESS: data["emergency_readiness"],
        }


class DocumentReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DocumentReviewStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class PhotoReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=PhotoVerificationStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class CaseActionSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    message = serializers.CharField(required=False, allow_blank=True, default="")


class CommunityReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_id = serializers.UUIDField(source="property.id", read_only=True)

    class Meta:
        model = CommunityReport
        fields = [
            "id",
            "property_id",
            "property_title",
            "title",
            "description",
            "category",
            "severity",
            "status",
            "is_public",
            "reporter_name",
            "created_at",
        ]
        read_only_fields = ["id", "status", "reporter_name", "created_at"]

    def get_reporter_name(self, obj):
        if not obj.reporter:
            return "Anonymous"
        return obj.reporter.profile.full_name or "Community Member"


class CommunityReportCreateSerializer(serializers.ModelSerializer):
    property_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = CommunityReport
        fields = ["property_id", "title", "description", "category", "severity"]

    def create(self, validated_data):
        property_id = validated_data.pop("property_id")
        user = self.context["request"].user
        return CommunityReport.objects.create(
            property_id=property_id,
            reporter=user,
            **validated_data,
        )
