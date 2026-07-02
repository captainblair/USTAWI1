from django.core.management.base import BaseCommand

from apps.properties.models import Property, PropertyStatus
from apps.verification.models import VerificationCase
from apps.verification.services.workflow import bootstrap_safety_score_if_missing


class Command(BaseCommand):
    help = "Backfill safety scores for verified listings that still show 0.0."

    def handle(self, *args, **options):
        props = Property.objects.filter(
            status=PropertyStatus.ACTIVE,
            is_verified=True,
            safety_score=0,
        )
        updated = 0
        for prop in props.iterator():
            case = VerificationCase.objects.filter(property=prop).order_by("-updated_at").first()
            if not case:
                case = VerificationCase.objects.create(property=prop)
            actor = case.assigned_inspector or prop.owner
            bootstrap_safety_score_if_missing(case, actor)
            prop.refresh_from_db()
            if prop.safety_score and prop.safety_score > 0:
                updated += 1
                self.stdout.write(f"  {prop.title}: {prop.safety_score}/10")

        self.stdout.write(self.style.SUCCESS(f"Updated {updated} listing(s)."))
