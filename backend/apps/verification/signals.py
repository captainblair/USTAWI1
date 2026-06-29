from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.properties.models import Property, PropertyStatus


@receiver(post_save, sender=Property)
def sync_verification_on_pending_review(sender, instance, created, **kwargs):
    if instance.status == PropertyStatus.PENDING_REVIEW:
        from apps.verification.services.workflow import create_verification_case

        create_verification_case(instance)
