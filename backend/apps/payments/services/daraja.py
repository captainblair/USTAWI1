import base64
import logging
import secrets
from datetime import datetime

import requests
from django.conf import settings

from apps.accounts.services.africas_talking import normalize_kenyan_phone

logger = logging.getLogger(__name__)

SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE = "https://api.safaricom.co.ke"


class MpesaDarajaError(Exception):
    pass


class MpesaDarajaClient:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.environment = settings.MPESA_ENVIRONMENT

    @property
    def base_url(self) -> str:
        return PRODUCTION_BASE if self.environment == "production" else SANDBOX_BASE

    @property
    def is_configured(self) -> bool:
        return bool(
            self.consumer_key
            and self.consumer_secret
            and self.shortcode
            and self.passkey
            and self.callback_url
        )

    def _mpesa_phone(self, phone: str) -> str:
        normalized = normalize_kenyan_phone(phone)
        return normalized.lstrip("+")

    def _timestamp(self) -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _password(self, timestamp: str) -> str:
        raw = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(raw.encode()).decode()

    def get_access_token(self) -> str:
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(
            url,
            auth=(self.consumer_key, self.consumer_secret),
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    def stk_push(
        self,
        *,
        phone: str,
        amount: int,
        account_reference: str,
        transaction_desc: str,
    ) -> dict:
        if not self.is_configured:
            return self._dev_stk_push(phone, amount, account_reference)

        token = self.get_access_token()
        timestamp = self._timestamp()
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": self._password(timestamp),
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": self._mpesa_phone(phone),
            "PartyB": self.shortcode,
            "PhoneNumber": self._mpesa_phone(phone),
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference[:12],
            "TransactionDesc": transaction_desc[:13],
        }
        response = requests.post(
            f"{self.base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        data = response.json()
        if response.status_code != 200 or data.get("ResponseCode") != "0":
            raise MpesaDarajaError(data.get("errorMessage") or data.get("ResponseDescription") or "STK Push failed")
        return {
            "status": "initiated",
            "MerchantRequestID": data.get("MerchantRequestID", ""),
            "CheckoutRequestID": data.get("CheckoutRequestID", ""),
            "ResponseDescription": data.get("ResponseDescription", ""),
        }

    def _dev_stk_push(self, phone: str, amount: int, account_reference: str) -> dict:
        checkout_id = f"ws_CO_DEV_{secrets.token_hex(8)}"
        merchant_id = f"dev_{secrets.token_hex(6)}"
        logger.info(
            "DEV MODE M-Pesa STK Push: phone=%s amount=%s ref=%s checkout=%s",
            phone,
            amount,
            account_reference,
            checkout_id,
        )
        return {
            "status": "dev_mode",
            "MerchantRequestID": merchant_id,
            "CheckoutRequestID": checkout_id,
            "ResponseDescription": "Dev mode STK push simulated. Use simulate-callback endpoint.",
        }
