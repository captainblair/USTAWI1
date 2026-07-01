from django.core.management.base import BaseCommand

from apps.properties.services.featured import sync_featured_properties


class Command(BaseCommand):
    help = "Recompute which public listings are marked as featured."

    def handle(self, *args, **options):
        featured_ids = sync_featured_properties()
        self.stdout.write(
            self.style.SUCCESS(f"Featured {len(featured_ids)} listing(s): {', '.join(featured_ids) or 'none'}")
        )
