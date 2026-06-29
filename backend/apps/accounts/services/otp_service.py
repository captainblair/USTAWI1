import logging
import secrets
import string

from django.conf import settings
from django.utils import timezone

from apps.accounts.models import RegistrationSession
from apps.accounts.services.africas_talking import AfricasTalkingSMSService, normalize_kenyan_phone

logger = logging.getLogger(__name__)


class OTPService:
    MAX_ATTEMPTS = 5

    def __init__(self):
        self.sms_service = AfricasTalkingSMSService()
        self.otp_length = settings.OTP_LENGTH
        self.otp_expiry_minutes = settings.OTP_EXPIRY_MINUTES

    def generate_code(self) -> str:
        return "".join(secrets.choice(string.digits) for _ in range(self.otp_length))

    def send_registration_otp(self, session: RegistrationSession) -> str:
        if not session.phone:
            raise ValueError("Phone number is required before sending OTP.")

        phone = normalize_kenyan_phone(session.phone)
        code = self.generate_code()

        session.otp_code = code
        session.otp_expires_at = timezone.now() + timezone.timedelta(minutes=self.otp_expiry_minutes)
        session.otp_attempts = 0
        session.step = "OTP_SENT"
        session.save(update_fields=["otp_code", "otp_expires_at", "otp_attempts", "step", "updated_at"])

        message = f"Your Ustawi verification code is {code}. Valid for {self.otp_expiry_minutes} minutes."
        result = self.sms_service.send_sms(phone, message)

        if result.get("status") == "dev_mode":
            logger.warning("DEV MODE OTP for %s: %s", phone, code)

        return code if result.get("status") == "dev_mode" else ""

    def verify_registration_otp(self, session: RegistrationSession, code: str) -> bool:
        if session.is_otp_expired:
            raise ValueError("OTP has expired. Please request a new code.")

        if session.otp_attempts >= self.MAX_ATTEMPTS:
            raise ValueError("Too many failed attempts. Please request a new OTP.")

        session.otp_attempts += 1
        session.save(update_fields=["otp_attempts", "updated_at"])

        if session.otp_code != code.strip():
            return False

        session.is_verified = True
        session.save(update_fields=["is_verified", "updated_at"])
        return True
