from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.leases.models import Lease
from apps.maintenance.models import (
    MAX_PHOTO_SIZE_BYTES,
    MaintenanceCategory,
    MaintenancePhoto,
    MaintenanceRequest,
    MaintenanceStatus,
    MaintenanceUpdate,
    MaintenanceUrgency,
)
from core.upload_validation import validate_image_upload


def validate_photo_size(image):
    if image.size > MAX_PHOTO_SIZE_BYTES:
        raise serializers.ValidationError("Each photo must be 10 MB or smaller.")
    try:
        validate_image_upload(image, max_size_bytes=MAX_PHOTO_SIZE_BYTES)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages)) from exc
    return image


class MaintenancePhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MaintenancePhoto
        fields = ["id", "image_url", "caption", "sort_order", "created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class MaintenanceUpdateSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceUpdate
        fields = [
            "id",
            "update_type",
            "actor_name",
            "old_status",
            "new_status",
            "message",
            "metadata",
            "created_at",
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        return obj.actor.profile.full_name or obj.actor.email


class MaintenanceListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    photo_count = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceRequest
        fields = [
            "id",
            "title",
            "property_title",
            "unit_label",
            "category",
            "urgency",
            "status",
            "photo_count",
            "assigned_technician_name",
            "created_at",
            "updated_at",
        ]

    def get_photo_count(self, obj):
        return obj.photos.count()


class MaintenanceDetailSerializer(MaintenanceListSerializer):
    description = serializers.CharField()
    lease_id = serializers.UUIDField(source="lease.id", read_only=True)
    property_id = serializers.UUIDField(source="property.id", read_only=True)
    photos = MaintenancePhotoSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()
    assigned_technician_phone = serializers.CharField()
    assigned_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField()
    closed_at = serializers.DateTimeField()

    class Meta(MaintenanceListSerializer.Meta):
        fields = MaintenanceListSerializer.Meta.fields + [
            "description",
            "lease_id",
            "property_id",
            "photos",
            "timeline",
            "assigned_technician_phone",
            "assigned_at",
            "resolved_at",
            "closed_at",
        ]

    def get_timeline(self, obj):
        updates = obj.updates.select_related("actor", "actor__profile").all()
        return MaintenanceUpdateSerializer(updates, many=True).data


class MaintenanceCreateSerializer(serializers.Serializer):
    lease_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    category = serializers.ChoiceField(choices=MaintenanceCategory.choices)
    urgency = serializers.ChoiceField(choices=MaintenanceUrgency.choices, default=MaintenanceUrgency.MEDIUM)
    unit_label = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_lease_id(self, value):
        try:
            return Lease.objects.select_related("property", "landlord").get(pk=value)
        except Lease.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid lease.") from exc


class MaintenancePhotoUploadSerializer(serializers.Serializer):
    image = serializers.ImageField(validators=[validate_photo_size])
    caption = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")


class AssignTechnicianSerializer(serializers.Serializer):
    technician_name = serializers.CharField(max_length=255)
    technician_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    note = serializers.CharField(required=False, allow_blank=True, default="")


class MaintenanceStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=MaintenanceStatus.choices)
    message = serializers.CharField(required=False, allow_blank=True, default="")


class LandlordMaintenanceListSerializer(MaintenanceListSerializer):
    tenant_name = serializers.CharField(source="tenant.profile.full_name", read_only=True)

    class Meta(MaintenanceListSerializer.Meta):
        fields = MaintenanceListSerializer.Meta.fields + ["tenant_name"]
