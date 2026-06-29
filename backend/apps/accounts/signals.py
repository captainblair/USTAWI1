from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.accounts.models import NotificationPreference, User, UserProfile


@receiver(post_save, sender=User)
def create_user_related_objects(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
        NotificationPreference.objects.get_or_create(user=instance)
