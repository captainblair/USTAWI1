from django.apps import AppConfig


class VerificationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.verification"
    label = "verification"

    def ready(self):
        import apps.verification.signals  # noqa: F401
