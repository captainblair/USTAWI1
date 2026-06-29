from rest_framework import serializers

from apps.notifications.models import ActivityEvent, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "category",
            "title",
            "message",
            "is_read",
            "read_at",
            "reference_type",
            "reference_id",
            "action_path",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class NotificationBadgeSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    applications = serializers.IntegerField()
    payments = serializers.IntegerField()
    maintenance = serializers.IntegerField()
    system = serializers.IntegerField()
    by_category = serializers.ListField()


class ActivityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityEvent
        fields = [
            "id",
            "category",
            "event_type",
            "title",
            "description",
            "reference_type",
            "reference_id",
            "actor_name",
            "metadata",
            "created_at",
        ]
