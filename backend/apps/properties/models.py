import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel


class PropertyStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    ACTIVE = "ACTIVE", "Active"
    OCCUPIED = "OCCUPIED", "Occupied"
    VACANT = "VACANT", "Vacant"
    REJECTED = "REJECTED", "Rejected"


class PropertyType(models.TextChoices):
    APARTMENT = "APARTMENT", "Apartment"
    VILLA = "VILLA", "Villa"
    PENTHOUSE = "PENTHOUSE", "Penthouse"
    TOWNHOUSE = "TOWNHOUSE", "Townhouse"
    STUDIO = "STUDIO", "Studio"
    BEDSITTER = "BEDSITTER", "Bedsitter"
    MAISONETTE = "MAISONETTE", "Maisonette"


class ImageType(models.TextChoices):
    GALLERY = "GALLERY", "Gallery"
    FLOOR_PLAN = "FLOOR_PLAN", "Floor Plan"
    THUMBNAIL = "THUMBNAIL", "Thumbnail"


class DocumentType(models.TextChoices):
    TITLE_DEED = "TITLE_DEED", "Title Deed"
    LEASE = "LEASE", "Lease"
    INSPECTION = "INSPECTION", "Inspection Report"
    OTHER = "OTHER", "Other"


class Neighborhood(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    city = models.CharField(max_length=100, default="Nairobi")
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["city", "slug"])]

    def __str__(self):
        return f"{self.name}, {self.city}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Amenity(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "amenities"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Property(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField(blank=True, default="")

    property_type = models.CharField(max_length=20, choices=PropertyType.choices)
    status = models.CharField(
        max_length=20,
        choices=PropertyStatus.choices,
        default=PropertyStatus.DRAFT,
        db_index=True,
    )

    neighborhood = models.ForeignKey(
        Neighborhood,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="properties",
    )
    address = models.CharField(max_length=500, blank=True, default="")
    city = models.CharField(max_length=100, default="Nairobi", db_index=True)

    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    price_monthly = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    bedrooms = models.PositiveSmallIntegerField(default=1)
    bathrooms = models.PositiveSmallIntegerField(default=1)
    size_sqm = models.PositiveIntegerField(null=True, blank=True)
    year_built = models.PositiveSmallIntegerField(null=True, blank=True)
    furnished = models.BooleanField(default=False)
    pet_friendly = models.BooleanField(default=False)

    safety_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        help_text="Placeholder until Phase 4 verification scoring.",
    )
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False, db_index=True)

    virtual_tour_url = models.URLField(blank=True, default="")
    amenities = models.ManyToManyField(Amenity, blank=True, related_name="properties")

    published_at = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "properties"
        indexes = [
            models.Index(fields=["status", "city"]),
            models.Index(fields=["price_monthly"]),
            models.Index(fields=["-safety_score"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)
            self.slug = base
            counter = 1
            while Property.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{counter}"
                counter += 1
        super().save(*args, **kwargs)


class PropertyImage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="properties/gallery/")
    image_type = models.CharField(
        max_length=20, choices=ImageType.choices, default=ImageType.GALLERY
    )
    caption = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"{self.property.title} — {self.image_type}"


class PropertyDocument(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=255)
    document = models.FileField(upload_to="properties/documents/")
    doc_type = models.CharField(
        max_length=20, choices=DocumentType.choices, default=DocumentType.OTHER
    )
    is_public = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class SavedProperty(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_properties",
    )
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="saved_by"
    )

    class Meta:
        unique_together = [("user", "property")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} saved {self.property.title}"
