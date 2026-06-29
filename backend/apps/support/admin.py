from django.contrib import admin

from apps.support.models import (
    CaseAttachment,
    CaseMessage,
    KnowledgeBaseArticle,
    LiveChatMessage,
    LiveChatSession,
    SupportCase,
)


class CaseAttachmentInline(admin.TabularInline):
    model = CaseAttachment
    extra = 0


class CaseMessageInline(admin.TabularInline):
    model = CaseMessage
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(SupportCase)
class SupportCaseAdmin(admin.ModelAdmin):
    list_display = ("case_number", "subject", "reporter", "category", "urgency", "status", "created_at")
    list_filter = ("status", "category", "urgency")
    search_fields = ("case_number", "subject", "reporter__email")
    inlines = [CaseAttachmentInline, CaseMessageInline]


@admin.register(KnowledgeBaseArticle)
class KnowledgeBaseArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "is_published", "sort_order")
    list_filter = ("category", "is_published")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(LiveChatSession)
class LiveChatSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "subject", "created_at")


@admin.register(LiveChatMessage)
class LiveChatMessageAdmin(admin.ModelAdmin):
    list_display = ("session", "is_agent", "created_at")
