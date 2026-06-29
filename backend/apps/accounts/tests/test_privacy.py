from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()


class PrivacyEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="privacy@test.com",
            password="SecurePass123!",
            role="TENANT",
        )
        self.client.force_authenticate(user=self.user)

    def test_data_export_returns_user_bundle(self):
        response = self.client.get(reverse("profile:data-export"))
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["user"]["email"], "privacy@test.com")
        self.assertIn("profile", data)
        self.assertIn("exported_at", data)

    def test_account_deletion_requires_password(self):
        response = self.client.post(
            reverse("profile:delete-account"),
            {"password": "wrong-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_account_deletion_anonymizes_user(self):
        response = self.client.post(
            reverse("profile:delete-account"),
            {"password": "SecurePass123!", "reason": "No longer needed"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertTrue(self.user.email.startswith("deleted-"))
