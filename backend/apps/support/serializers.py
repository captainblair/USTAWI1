from rest_framework import serializers

from apps.support.models import (
    MAX_ATTACHMENT_SIZE_BYTES,
    CaseAttachment,
    CaseMessage,
    KnowledgeBaseArticle,
    KnowledgeBaseCategory,
    LiveChatMessage,
    LiveChatSession,
    SupportCase,
    SupportCaseCategory,
    SupportCaseStatus,
)


def validate_attachment_size(file):
    if file.size > MAX_ATTACHMENT_SIZE_BYTES:
        raise serializers.ValidationError("Each attachment must be 10 MB or smaller.")
    return file


class CaseAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CaseAttachment
        fields = ["id", "filename", "file_url", "created_at"]

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


class CaseMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = CaseMessage
        fields = ["id", "sender_name", "body", "is_internal", "created_at"]

    def get_sender_name(self, obj):
        if not obj.sender:
            return "Support"
        return obj.sender.profile.full_name or obj.sender.email


class SupportCaseListSerializer(serializers.ModelSerializer):
    attachment_count = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportCase
        fields = [
            "id",
            "case_number",
            "category",
            "urgency",
            "status",
            "subject",
            "attachment_count",
            "message_count",
            "created_at",
            "updated_at",
        ]

    def get_attachment_count(self, obj):
        return obj.attachments.count()

    def get_message_count(self, obj):
        return obj.messages.filter(is_internal=False).count()


class SupportCaseDetailSerializer(SupportCaseListSerializer):
    description = serializers.CharField()
    resolution_notes = serializers.CharField()
    property_id = serializers.UUIDField(source="property.id", read_only=True, allow_null=True)
    lease_id = serializers.UUIDField(source="lease.id", read_only=True, allow_null=True)
    attachments = CaseAttachmentSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()
    assigned_admin_name = serializers.SerializerMethodField()
    escalated_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField()

    class Meta(SupportCaseListSerializer.Meta):
        fields = SupportCaseListSerializer.Meta.fields + [
            "description",
            "resolution_notes",
            "property_id",
            "lease_id",
            "attachments",
            "messages",
            "assigned_admin_name",
            "escalated_at",
            "resolved_at",
        ]

    def get_messages(self, obj):
        request = self.context.get("request")
        qs = obj.messages.all()
        if request and (request.user.role == "ADMIN" or request.user.is_superuser):
            pass
        else:
            qs = qs.filter(is_internal=False)
        return CaseMessageSerializer(qs, many=True, context=self.context).data

    def get_assigned_admin_name(self, obj):
        if not obj.assigned_admin:
            return None
        return obj.assigned_admin.profile.full_name or obj.assigned_admin.email


class SupportCaseCreateSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=SupportCaseCategory.choices)
    urgency = serializers.IntegerField(min_value=1, max_value=5, default=3)
    subject = serializers.CharField(max_length=255)
    description = serializers.CharField()
    property_id = serializers.UUIDField(required=False, allow_null=True)
    lease_id = serializers.UUIDField(required=False, allow_null=True)


class CaseMessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField()


class AdminCaseUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportCaseStatus.choices)
    resolution_notes = serializers.CharField(required=False, allow_blank=True, default="")


class AdminCaseEscalateSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default="")


class KnowledgeBaseArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseArticle
        fields = [
            "id",
            "title",
            "slug",
            "category",
            "summary",
            "content",
            "sort_order",
            "updated_at",
        ]


class KnowledgeBaseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseArticle
        fields = ["id", "title", "slug", "category", "summary", "sort_order"]


class LiveChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveChatSession
        fields = ["id", "status", "subject", "created_at", "updated_at"]


class LiveChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = LiveChatMessage
        fields = ["id", "sender_name", "body", "is_agent", "created_at"]

    def get_sender_name(self, obj):
        if obj.is_agent:
            return "Ustawi Support"
        if not obj.sender:
            return "Guest"
        return obj.sender.profile.full_name or obj.sender.email


class LiveChatMessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField()


class LiveChatSessionCreateSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
