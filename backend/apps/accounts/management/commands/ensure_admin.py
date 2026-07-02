from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Create or promote an admin user by email (for production Neon setup)."

    def add_arguments(self, parser):
        parser.add_argument("email", type=str)
        parser.add_argument(
            "--password",
            type=str,
            default="",
            help="Password for new users (optional if using Google sign-in later).",
        )
        parser.add_argument("--name", type=str, default="", help="Full name for profile.")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        full_name = options["name"].strip()

        user = User.objects.filter(email__iexact=email).first()
        if user:
            user.role = UserRole.ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.is_email_verified = True
            user.save()
            action = "Updated"
        else:
            if not password:
                password = User.objects.make_random_password(length=16)
            user = User.objects.create_superuser(email=email, password=password)
            action = "Created"

        if full_name and hasattr(user, "profile"):
            user.profile.full_name = full_name
            user.profile.save(update_fields=["full_name", "updated_at"])

        self.stdout.write(self.style.SUCCESS(f"{action} admin: {user.email} (role={user.role})"))
        if action == "Created" and not options["password"]:
            self.stdout.write(f"Temporary password: {password}")
