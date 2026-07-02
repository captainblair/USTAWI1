from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.properties.models import (
    Amenity,
    ImageType,
    Neighborhood,
    Property,
    PropertyDocument,
    PropertyImage,
    PropertyStatus,
    PropertyType,
    SavedProperty,
)

User = get_user_model()

NAIROBI_CENTER = (Decimal("-1.286389"), Decimal("36.817223"))
NEIGHBORHOOD_COORDS = {
    "karen": (Decimal("-1.319700"), Decimal("36.707300")),
    "westlands": (Decimal("-1.267600"), Decimal("36.807800")),
    "kilimani": (Decimal("-1.292066"), Decimal("36.785016")),
    "peponi": (Decimal("-1.240000"), Decimal("36.800000")),
    "lavington": (Decimal("-1.279000"), Decimal("36.768000")),
    "parklands": (Decimal("-1.263000"), Decimal("36.819000")),
}


def _coords_for_neighborhood(slug: str) -> tuple[Decimal, Decimal]:
    if slug:
        return NEIGHBORHOOD_COORDS.get(slug.strip().lower(), NAIROBI_CENTER)
    return NAIROBI_CENTER


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name", "slug", "icon"]


class NeighborhoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Neighborhood
        fields = ["id", "name", "slug", "city", "description"]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = [
            "id",
            "image",
            "image_type",
            "caption",
            "sort_order",
            "is_primary",
            "verification_status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "verification_status"]


class PropertyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDocument
        fields = ["id", "title", "document", "doc_type", "is_public", "created_at"]
        read_only_fields = ["id", "created_at"]


class LandlordBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", read_only=True)
    is_verified_landlord = serializers.BooleanField(source="profile.is_verified_landlord", read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "avatar", "is_phone_verified", "is_verified_landlord"]
        read_only_fields = fields

    def get_avatar(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile or not profile.avatar:
            return None
        url = profile.avatar.url
        if url.startswith(("http://", "https://")):
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url if url.startswith("/") else f"/{url}")
        return url if url.startswith("/") else f"/{url}"


class PropertyListSerializer(serializers.ModelSerializer):
    neighborhood = NeighborhoodSerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    landlord_name = serializers.CharField(source="owner.profile.full_name", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "slug",
            "property_type",
            "status",
            "neighborhood",
            "city",
            "address",
            "latitude",
            "longitude",
            "price_monthly",
            "currency",
            "bedrooms",
            "bathrooms",
            "safety_score",
            "is_verified",
            "is_featured",
            "amenities",
            "primary_image",
            "landlord_name",
            "published_at",
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if not img:
            return None
        request = self.context.get("request")
        url = img.image.url
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class PropertyDetailSerializer(PropertyListSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()
    owner = LandlordBriefSerializer(read_only=True)
    is_saved = serializers.SerializerMethodField()
    safety_score_breakdown = serializers.SerializerMethodField()
    community_reports = serializers.SerializerMethodField()

    class Meta(PropertyListSerializer.Meta):
        fields = PropertyListSerializer.Meta.fields + [
            "description",
            "size_sqm",
            "year_built",
            "furnished",
            "pet_friendly",
            "virtual_tour_url",
            "images",
            "documents",
            "owner",
            "views_count",
            "is_saved",
            "safety_score_breakdown",
            "community_reports",
            "created_at",
            "updated_at",
        ]

    def get_documents(self, obj):
        docs = obj.documents.filter(is_public=True)
        return PropertyDocumentSerializer(docs, many=True, context=self.context).data

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return SavedProperty.objects.filter(user=request.user, property=obj).exists()

    def get_safety_score_breakdown(self, obj):
        record = getattr(obj, "safety_score_record", None)
        if not record:
            return {"overall_score": float(obj.safety_score), "factors": []}
        from apps.verification.serializers import SafetyScoreSerializer

        return SafetyScoreSerializer(record).data

    def get_community_reports(self, obj):
        from apps.verification.models import CommunityReportStatus
        from apps.verification.serializers import CommunityReportSerializer

        reports = obj.community_reports.filter(
            is_public=True, status=CommunityReportStatus.VERIFIED
        ).order_by("-created_at")[:10]
        return CommunityReportSerializer(reports, many=True, context=self.context).data


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    amenity_slugs = serializers.ListField(
        child=serializers.SlugField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    neighborhood_slug = serializers.SlugField(write_only=True, required=False, allow_blank=True)

    def validate_neighborhood_slug(self, value):
        if not value:
            return ""
        return value.strip().lower()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)

    class Meta:
        model = Property
        fields = [
            "title",
            "description",
            "property_type",
            "neighborhood_slug",
            "address",
            "city",
            "latitude",
            "longitude",
            "price_monthly",
            "currency",
            "bedrooms",
            "bathrooms",
            "size_sqm",
            "year_built",
            "furnished",
            "pet_friendly",
            "virtual_tour_url",
            "amenity_slugs",
            "is_featured",
        ]

    def validate_property_type(self, value):
        if value not in dict(PropertyType.choices):
            raise serializers.ValidationError("Invalid property type.")
        return value

    def _set_neighborhood(self, instance, neighborhood_slug):
        if neighborhood_slug:
            neighborhood, _ = Neighborhood.objects.get_or_create(
                slug=neighborhood_slug,
                defaults={"name": neighborhood_slug.replace("-", " ").title()},
            )
            instance.neighborhood = neighborhood

    def _set_amenities(self, instance, slugs):
        if slugs is not None:
            amenities = []
            for slug in slugs:
                amenity, _ = Amenity.objects.get_or_create(
                    slug=slug,
                    defaults={"name": slug.replace("-", " ").title()},
                )
                amenities.append(amenity)
            instance.amenities.set(amenities)

    def create(self, validated_data):
        amenity_slugs = validated_data.pop("amenity_slugs", [])
        neighborhood_slug = validated_data.pop("neighborhood_slug", "")
        validated_data["owner"] = self.context["request"].user
        validated_data["status"] = PropertyStatus.DRAFT
        if validated_data.get("latitude") is None or validated_data.get("longitude") is None:
            lat, lng = _coords_for_neighborhood(neighborhood_slug)
            validated_data.setdefault("latitude", lat)
            validated_data.setdefault("longitude", lng)
        instance = Property.objects.create(**validated_data)
        self._set_neighborhood(instance, neighborhood_slug)
        instance.save()
        self._set_amenities(instance, amenity_slugs)
        return instance

    def update(self, instance, validated_data):
        amenity_slugs = validated_data.pop("amenity_slugs", None)
        neighborhood_slug = validated_data.pop("neighborhood_slug", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if neighborhood_slug is not None:
            self._set_neighborhood(instance, neighborhood_slug)
        instance.save()
        if amenity_slugs is not None:
            self._set_amenities(instance, amenity_slugs)
        return instance


class PropertyImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["image", "image_type", "caption", "sort_order", "is_primary"]

    def validate_image_type(self, value):
        if value not in dict(ImageType.choices):
            raise serializers.ValidationError("Invalid image type.")
        return value

    def create(self, validated_data):
        validated_data["property"] = self.context["property"]
        image = super().create(validated_data)
        if image.is_primary:
            PropertyImage.objects.filter(property=image.property).exclude(pk=image.pk).update(
                is_primary=False
            )
        return image


class SavedPropertySerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    property_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = SavedProperty
        fields = ["id", "property", "property_id", "created_at"]
        read_only_fields = ["id", "property", "created_at"]

    def validate_property_id(self, value):
        if not Property.objects.filter(pk=value, status=PropertyStatus.ACTIVE).exists():
            raise serializers.ValidationError("Active property not found.")
        return value

    def create(self, validated_data):
        property_id = validated_data.pop("property_id")
        user = self.context["request"].user
        saved, _ = SavedProperty.objects.get_or_create(
            user=user,
            property_id=property_id,
        )
        return saved
