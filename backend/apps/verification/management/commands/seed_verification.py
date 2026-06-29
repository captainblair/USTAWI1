from django.core.management.base import BaseCommand

from apps.accounts.models import User, UserProfile, UserRole
from apps.properties.models import Property, PropertyStatus
from apps.verification.services.workflow import create_verification_case


class Command(BaseCommand):
    help = "Create inspector user and backfill verification cases for pending properties."

    def handle(self, *args, **options):
        inspector, created = User.objects.get_or_create(
            email="inspector@test.com",
            defaults={
                "role": UserRole.INSPECTOR,
                "is_active": True,
                "is_phone_verified": True,
            },
        )
        if created:
            inspector.set_password("SecurePass123!")
            inspector.save()
            UserProfile.objects.get_or_create(
                user=inspector,
                defaults={"full_name": "Test Inspector"},
            )
            self.stdout.write(self.style.SUCCESS("Created inspector@test.com / SecurePass123!"))
        else:
            self.stdout.write("Inspector user already exists.")

        pending = Property.objects.filter(status=PropertyStatus.PENDING_REVIEW)
        count = 0
        for prop in pending:
            create_verification_case(prop)
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Backfilled {count} verification case(s)."))
