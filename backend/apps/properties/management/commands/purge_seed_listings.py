from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.applications.models import RentalApplication
from apps.leases.models import Lease
from apps.maintenance.models import MaintenanceRequest
from apps.payments.models import Invoice, Payment
from apps.properties.models import Property
from apps.properties.services.featured import sync_featured_properties

User = get_user_model()

DEFAULT_SEED_LANDLORD = "landlord@test.com"


def _delete_property_graph(prop: Property) -> None:
    lease_ids = list(Lease.objects.filter(property=prop).values_list("id", flat=True))
    if lease_ids:
        Payment.objects.filter(invoice__lease_id__in=lease_ids).delete()
        Invoice.objects.filter(lease_id__in=lease_ids).delete()
        MaintenanceRequest.objects.filter(lease_id__in=lease_ids).delete()
        Lease.objects.filter(id__in=lease_ids).delete()
    MaintenanceRequest.objects.filter(property=prop).delete()
    RentalApplication.objects.filter(property=prop).delete()
    prop.delete()


class Command(BaseCommand):
    help = "Remove demo listings seeded by seed_properties (keeps real landlord listings)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--seed-landlord-email",
            type=str,
            default=DEFAULT_SEED_LANDLORD,
            help="Email of the demo landlord whose listings should be removed",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without deleting",
        )
        parser.add_argument(
            "--delete-seed-user",
            action="store_true",
            help="Also delete the demo landlord account if they have no remaining listings",
        )

    def handle(self, *args, **options):
        seed_email = options["seed_landlord_email"].strip().lower()
        landlord = User.objects.filter(email__iexact=seed_email).first()

        if not landlord:
            self.stdout.write(self.style.WARNING(f"No user found for {seed_email}."))
            sync_featured_properties()
            self.stdout.write(self.style.SUCCESS("Featured listings refreshed."))
            return

        props = Property.objects.filter(owner=landlord)
        count = props.count()

        if count == 0:
            self.stdout.write(f"No listings found for {seed_email}.")
        elif options["dry_run"]:
            for prop in props:
                self.stdout.write(f"Would delete: {prop.title} ({prop.slug})")
        else:
            with transaction.atomic():
                titles = []
                for prop in list(props):
                    titles.append(prop.title)
                    _delete_property_graph(prop)
                for title in titles:
                    self.stdout.write(self.style.SUCCESS(f"Deleted: {title}"))

                if options["delete_seed_user"] and not Property.objects.filter(owner=landlord).exists():
                    landlord.delete()
                    self.stdout.write(self.style.SUCCESS(f"Deleted demo user: {seed_email}"))

        if not options["dry_run"]:
            featured = sync_featured_properties()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done. Removed {count} demo listing(s). {len(featured)} property(ies) now featured."
                )
            )
