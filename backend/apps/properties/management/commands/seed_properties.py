from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import UserRole
from apps.properties.models import Amenity, Neighborhood, Property, PropertyImage, PropertyStatus, PropertyType

User = get_user_model()

# Nairobi area sample coordinates
SAMPLE_LOCATIONS = {
    "karen": {"lat": Decimal("-1.319700"), "lng": Decimal("36.707300"), "neighborhood": "Karen"},
    "peponi": {"lat": Decimal("-1.229500"), "lng": Decimal("36.807800"), "neighborhood": "Peponi"},
    "westlands": {"lat": Decimal("-1.267400"), "lng": Decimal("36.807000"), "neighborhood": "Westlands"},
    "kilimani": {"lat": Decimal("-1.292100"), "lng": Decimal("36.787800"), "neighborhood": "Kilimani"},
    "lavington": {"lat": Decimal("-1.279600"), "lng": Decimal("36.766200"), "neighborhood": "Lavington"},
}

SAMPLE_LISTINGS = [
    {
        "folder": "5 bedroom",
        "title": "5 Bedroom Villa in Karen",
        "property_type": PropertyType.VILLA,
        "bedrooms": 5,
        "bathrooms": 4,
        "price": Decimal("150000"),
        "location_key": "karen",
        "safety_score": Decimal("8.5"),
        "amenities": ["pool", "parking", "24-7-security", "pet-friendly"],
    },
    {
        "folder": "6 bedroom",
        "title": "6 Bedroom Villa in Peponi",
        "property_type": PropertyType.VILLA,
        "bedrooms": 6,
        "bathrooms": 5,
        "price": Decimal("250000"),
        "location_key": "peponi",
        "safety_score": Decimal("9.0"),
        "amenities": ["pool", "parking", "garden", "24-7-security"],
    },
    {
        "folder": "penthouse",
        "title": "Penthouse in Westlands",
        "property_type": PropertyType.PENTHOUSE,
        "bedrooms": 3,
        "bathrooms": 3,
        "price": Decimal("85000"),
        "location_key": "westlands",
        "safety_score": Decimal("9.1"),
        "amenities": ["parking", "gym", "balcony", "24-7-security"],
    },
]


class Command(BaseCommand):
    help = "Seed sample property listings from images/house samples images/"

    def add_arguments(self, parser):
        parser.add_argument(
            "--images-dir",
            type=str,
            default="",
            help="Path to house sample images directory",
        )
        parser.add_argument(
            "--landlord-email",
            type=str,
            default="landlord@test.com",
            help="Landlord email to assign properties to",
        )
        parser.add_argument(
            "--activate",
            action="store_true",
            help="Set properties to ACTIVE status (skip pending review)",
        )

    def handle(self, *args, **options):
        images_dir = self._resolve_images_dir(options["images_dir"])
        if not images_dir.exists():
            self.stderr.write(self.style.ERROR(f"Images directory not found: {images_dir}"))
            return

        landlord = self._get_or_create_landlord(options["landlord_email"])
        amenities_map = self._ensure_amenities()
        status = PropertyStatus.ACTIVE if options["activate"] else PropertyStatus.PENDING_REVIEW

        created_count = 0
        for listing in SAMPLE_LISTINGS:
            folder = images_dir / listing["folder"]
            if not folder.exists():
                self.stdout.write(self.style.WARNING(f"Skipping missing folder: {folder}"))
                continue

            loc = SAMPLE_LOCATIONS[listing["location_key"]]
            neighborhood, _ = Neighborhood.objects.get_or_create(
                slug=slugify(loc["neighborhood"]),
                defaults={"name": loc["neighborhood"], "city": "Nairobi"},
            )

            prop, created = Property.objects.get_or_create(
                slug=slugify(listing["title"]),
                defaults={
                    "owner": landlord,
                    "title": listing["title"],
                    "description": f"Beautiful {listing['title']} available for rent in Nairobi.",
                    "property_type": listing["property_type"],
                    "status": status,
                    "neighborhood": neighborhood,
                    "address": f"{loc['neighborhood']}, Nairobi",
                    "city": "Nairobi",
                    "latitude": loc["lat"],
                    "longitude": loc["lng"],
                    "price_monthly": listing["price"],
                    "bedrooms": listing["bedrooms"],
                    "bathrooms": listing["bathrooms"],
                    "safety_score": listing["safety_score"],
                    "is_verified": options["activate"],
                    "is_featured": True,
                    "published_at": timezone.now() if options["activate"] else None,
                    "pet_friendly": "pet-friendly" in listing["amenities"],
                },
            )

            if created:
                created_count += 1
                prop.amenities.set([amenities_map[a] for a in listing["amenities"] if a in amenities_map])
                self._attach_images(prop, folder)

            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Exists'}: {prop.title}"))

        self.stdout.write(self.style.SUCCESS(f"Done. {created_count} new properties seeded."))

    def _resolve_images_dir(self, override: str) -> Path:
        if override:
            return Path(override)
        # backend/ -> project root -> images/
        project_root = Path(settings.BASE_DIR).parent
        return project_root / "images" / "house samples images"

    def _get_or_create_landlord(self, email: str):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "role": UserRole.LANDLORD,
                "phone": "+254700000001",
                "is_phone_verified": True,
            },
        )
        if created:
            user.set_password("SecurePass123!")
            user.save()
            user.profile.full_name = "Olivia Usened"
            user.profile.save()
            self.stdout.write(self.style.SUCCESS(f"Created landlord: {email}"))
        return user

    def _ensure_amenities(self):
        defaults = {
            "pool": "Pool",
            "parking": "Parking",
            "24-7-security": "24/7 Security",
            "pet-friendly": "Pet Friendly",
            "garden": "Garden",
            "gym": "Gym",
            "balcony": "Balcony",
        }
        result = {}
        for slug, name in defaults.items():
            amenity, _ = Amenity.objects.get_or_create(slug=slug, defaults={"name": name})
            result[slug] = amenity
        return result

    def _attach_images(self, prop: Property, folder: Path):
        from django.core.files.base import ContentFile

        images = sorted(folder.glob("*.jpg")) + sorted(folder.glob("*.jpeg")) + sorted(folder.glob("*.png"))
        for idx, src in enumerate(images[:8]):
            with src.open("rb") as f:
                content = ContentFile(f.read(), name=f"{prop.slug}-{src.name}")
                PropertyImage.objects.create(
                    property=prop,
                    image=content,
                    sort_order=idx,
                    is_primary=(idx == 0),
                )
