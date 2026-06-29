from django.test import TestCase, override_settings
from django.urls import reverse


@override_settings(
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class HealthCheckTests(TestCase):
    def test_health_check_returns_200(self):
        response = self.client.get(reverse("health-check"))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertIn(response.json()["status"], ("healthy", "degraded"))
