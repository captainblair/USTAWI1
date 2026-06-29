from django.contrib import admin

from apps.properties.models import (
    Amenity,
    Neighborhood,
    Property,
    PropertyDocument,
    PropertyImage,
    SavedProperty,
)


@admin.register(Neighborhood)
class NeighborhoodAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "slug")
    search_fields = ("name", "city")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "icon")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0


class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "city",
        "status",
        "price_monthly",
        "safety_score",
        "is_featured",
        "is_verified",
    )
    list_filter = ("status", "city", "property_type", "is_featured", "is_verified")
    search_fields = ("title", "address", "owner__email")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("amenities",)
    inlines = [PropertyImageInline, PropertyDocumentInline]
    actions = ["mark_active", "mark_featured"]

    @admin.action(description="Mark selected as ACTIVE (dev/testing)")
    def mark_active(self, request, queryset):
        from django.utils import timezone

        queryset.update(status="ACTIVE", published_at=timezone.now())

    @admin.action(description="Mark selected as featured")
    def mark_featured(self, request, queryset):
        queryset.update(is_featured=True)


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    list_display = ("user", "property", "created_at")
    search_fields = ("user__email", "property__title")
