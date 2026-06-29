from django.contrib import admin

from apps.notifications.models import ActivityEvent, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "category", "is_read", "created_at")
    list_filter = ("category", "is_read")
    search_fields = ("title", "user__email")


@admin.register(ActivityEvent)
class ActivityEventAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "category", "event_type", "created_at")
    list_filter = ("category", "event_type")
