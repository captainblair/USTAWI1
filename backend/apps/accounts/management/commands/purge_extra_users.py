from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import RegistrationSession
from apps.applications.models import RentalApplication
from apps.leases.models import Lease
from apps.maintenance.models import MaintenanceRequest
from apps.notifications.models import ActivityEvent, Notification
from apps.payments.models import Invoice, Payment
from apps.properties.models import Property, SavedProperty
from apps.properties.services.featured import sync_featured_properties

User = get_user_model()

DEFAULT_KEEP_EMAILS = (
    "wangolotony4@gmail.com",
    "hillcrestventures1@gmail.com",
    "blairtonyblair3@gmail.com",
)


def _delete_lease_graph(lease: Lease) -> None:
    Payment.objects.filter(invoice__lease=lease).delete()
    Invoice.objects.filter(lease=lease).delete()
    MaintenanceRequest.objects.filter(lease=lease).delete()
    application = lease.application
    lease.delete()
    if application and not hasattr(application, "lease"):
        application.delete()


def _delete_property_graph(prop: Property) -> None:
    for lease in list(Lease.objects.filter(property=prop)):
        _delete_lease_graph(lease)
    MaintenanceRequest.objects.filter(property=prop).delete()
    RentalApplication.objects.filter(property=prop).delete()
    SavedProperty.objects.filter(property=prop).delete()
    prop.delete()


def _delete_user_data(user) -> None:
    for prop in list(Property.objects.filter(owner=user)):
        _delete_property_graph(prop)

    for lease in list(Lease.objects.filter(tenant=user)):
        _delete_lease_graph(lease)

    for lease in list(Lease.objects.filter(landlord=user)):
        _delete_lease_graph(lease)

    RentalApplication.objects.filter(tenant=user).delete()
    Payment.objects.filter(tenant=user).delete()
    Payment.objects.filter(landlord=user).delete()
    SavedProperty.objects.filter(user=user).delete()
    Notification.objects.filter(user=user).delete()
    ActivityEvent.objects.filter(user=user).delete()
    RegistrationSession.objects.filter(email__iexact=user.email).delete()


class Command(BaseCommand):
    help = "Remove all users except the allowed keep-list (and their owned data)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-email",
            action="append",
            dest="keep_emails",
            help="Email to keep (repeatable). Defaults to wangolotony, Hillcrest, Tonyblair.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List users that would be removed without deleting.",
        )

    def handle(self, *args, **options):
        keep_emails = {e.strip().lower() for e in (options["keep_emails"] or DEFAULT_KEEP_EMAILS)}
        dry_run = options["dry_run"]

        missing = [
            email
            for email in keep_emails
            if not User.objects.filter(email__iexact=email).exists()
        ]
        if missing:
            raise CommandError(f"Keep-list users not found: {', '.join(sorted(missing))}")

        to_remove = User.objects.exclude(email__in=[e for e in keep_emails]).order_by("email")

        if not to_remove.exists():
            self.stdout.write(self.style.SUCCESS("No extra users to remove."))
            return

        self.stdout.write(f"Keeping {len(keep_emails)} user(s). Removing {to_remove.count()} user(s):")
        for user in to_remove:
            props = Property.objects.filter(owner=user).count()
            self.stdout.write(f"  - {user.email} ({user.role}) — {props} listing(s)")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        removed = []
        with transaction.atomic():
            for user in list(to_remove):
                email = user.email
                role = user.role
                _delete_user_data(user)
                user.delete()
                removed.append(f"{email} ({role})")

        featured = sync_featured_properties()
        for line in removed:
            self.stdout.write(self.style.SUCCESS(f"Removed: {line}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {len(removed)} user(s) removed. {User.objects.count()} remain. "
                f"{len(featured)} featured listing(s)."
            )
        )
