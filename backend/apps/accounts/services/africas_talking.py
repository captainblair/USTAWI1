import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def normalize_kenyan_phone(phone: str) -> str:
    """Normalize phone to +254XXXXXXXXX format."""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("254"):
        return f"+{digits}"
    if digits.startswith("0") and len(digits) == 10:
        return f"+254{digits[1:]}"
    if len(digits) == 9:
        return f"+254{digits}"
    if phone.startswith("+"):
        return phone
    raise ValueError("Invalid Kenyan phone number format. Use +2547XXXXXXXX or 07XXXXXXXX.")


class AfricasTalkingSMSService:
    API_URL = "https://api.africastalking.com/version1/messaging"

    def __init__(self):
        self.username = settings.AFRICAS_TALKING_USERNAME
        self.api_key = settings.AFRICAS_TALKING_API_KEY
        self.sender_id = settings.AFRICAS_TALKING_SENDER_ID

    @property
    def is_configured(self) -> bool:
        return bool(self.username and self.api_key)

    @property
    def use_live_sms(self) -> bool:
        if not self.is_configured:
            return False
        if not getattr(settings, "AFRICAS_TALKING_SMS_ENABLED", True):
            return False
        # Sandbox credentials never deliver real SMS — skip the HTTP round-trip.
        if self.username.strip().lower() == "sandbox":
            return False
        return True

    def send_sms(self, phone: str, message: str) -> dict:
        phone = normalize_kenyan_phone(phone)

        if not self.use_live_sms:
            logger.info("SMS dev_mode for %s (live SMS disabled or sandbox)", phone)
            return {"status": "dev_mode", "phone": phone, "message": message}

        headers = {
            "apiKey": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        data = {
            "username": self.username,
            "to": phone,
            "message": message,
            "from": self.sender_id,
        }

        timeout = getattr(settings, "AFRICAS_TALKING_SMS_TIMEOUT", 6)
        try:
            response = requests.post(self.API_URL, headers=headers, data=data, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.warning("Africa's Talking SMS failed for %s: %s", phone, exc)
            return {"status": "dev_mode", "phone": phone, "message": message, "error": str(exc)}
