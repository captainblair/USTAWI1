from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from apps.accounts.models import UserRole

User = get_user_model()

GOOGLE_SIGNUP_ROLES = frozenset(
    {
        UserRole.TENANT,
        UserRole.LANDLORD,
        UserRole.AGENT,
    }
)


class GoogleAuthError(Exception):
    pass


class GoogleRoleRequiredError(GoogleAuthError):
    pass


class GoogleAccountNotFoundError(GoogleAuthError):
    pass


@dataclass
class GoogleIdentity:
    sub: str
    email: str
    full_name: str
    email_verified: bool


def verify_google_id_token(token: str) -> GoogleIdentity:
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "") or ""
    if not client_id:
        raise GoogleAuthError("Google sign-in is not configured on the server.")

    try:
        payload = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
    except ValueError as exc:
        raise GoogleAuthError("Invalid or expired Google sign-in token.") from exc

    if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise GoogleAuthError("Invalid Google token issuer.")

    email = (payload.get("email") or "").strip().lower()
    sub = payload.get("sub") or ""
    if not email or not sub:
        raise GoogleAuthError("Google account is missing required profile information.")

    if not payload.get("email_verified"):
        raise GoogleAuthError("Google email address is not verified.")

    full_name = (payload.get("name") or email.split("@")[0]).strip()
    return GoogleIdentity(sub=sub, email=email, full_name=full_name, email_verified=True)


def authenticate_or_register_with_google(id_token_str: str, role: str | None = None) -> tuple[User, bool]:
    identity = verify_google_id_token(id_token_str)

    user = User.objects.filter(google_sub=identity.sub).first()
    if user:
        _ensure_google_profile(user, identity)
        return user, False

    user = User.objects.filter(email__iexact=identity.email).first()
    if user:
        if user.google_sub and user.google_sub != identity.sub:
            raise GoogleAuthError("This email is linked to a different Google account.")
        user.google_sub = identity.sub
        _ensure_google_profile(user, identity)
        user.save(update_fields=["google_sub", "is_email_verified", "updated_at"])
        return user, False

    if not role:
        raise GoogleAccountNotFoundError(
            "No account found for this Google email. Sign up and choose tenant, landlord, or agent first."
        )

    if role not in GOOGLE_SIGNUP_ROLES:
        raise GoogleAuthError("Google sign-up is only available for tenant, landlord, and agent accounts.")

    user = User(
        email=identity.email,
        role=role,
        google_sub=identity.sub,
        is_email_verified=True,
        is_phone_verified=False,
    )
    user.set_unusable_password()
    user.save()

    profile = user.profile
    if not profile.full_name:
        profile.full_name = identity.full_name
        profile.save(update_fields=["full_name", "updated_at"])

    return user, True


def _ensure_google_profile(user: User, identity: GoogleIdentity) -> None:
    updates = []
    if not user.is_email_verified:
        user.is_email_verified = True
        updates.append("is_email_verified")
    if not user.google_sub:
        user.google_sub = identity.sub
        updates.append("google_sub")
    if updates:
        updates.append("updated_at")
        user.save(update_fields=updates)

    profile = user.profile
    if identity.full_name and not profile.full_name:
        profile.full_name = identity.full_name
        profile.save(update_fields=["full_name", "updated_at"])
