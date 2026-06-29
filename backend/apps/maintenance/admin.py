from django.contrib import admin

from apps.maintenance.models import MaintenancePhoto, MaintenanceRequest, MaintenanceUpdate


class MaintenancePhotoInline(admin.TabularInline):
    model = MaintenancePhoto
    extra = 0


class MaintenanceUpdateInline(admin.TabularInline):
    model = MaintenanceUpdate
    extra = 0
    readonly_fields = ("update_type", "actor", "old_status", "new_status", "created_at")


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ("title", "property", "tenant", "category", "urgency", "status", "created_at")
    list_filter = ("status", "category", "urgency")
    search_fields = ("title", "tenant__email", "property__title")
    inlines = [MaintenancePhotoInline, MaintenanceUpdateInline]
