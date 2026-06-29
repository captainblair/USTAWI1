from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginActivity, RegistrationSession, User
from apps.accounts.utils import get_client_ip, get_location_from_ip, get_user_agent


def create_registration_session(role: str) -> RegistrationSession:
    return RegistrationSession.objects.create(
        role=role,
        step="ROLE",
        expires_at=timezone.now() + timezone.timedelta(hours=24),
    )


def update_registration_profile(session: RegistrationSession, validated_data: dict) -> RegistrationSession:
    session.email = validated_data["email"]
    session.phone = validated_data["phone"]
    session.full_name = validated_data["full_name"]
    session.password = validated_data["password"]
    session.step = "PROFILE"
    session.save()
    return session


def complete_registration(session: RegistrationSession) -> User:
    user = User.objects.create_user(
        email=session.email,
        password=session.password,
        phone=session.phone,
        role=session.role,
        is_phone_verified=True,
        is_email_verified=False,
    )
    user.profile.full_name = session.full_name
    user.profile.save(update_fields=["full_name", "updated_at"])

    session.step = "COMPLETED"
    session.save(update_fields=["step", "updated_at"])
    return user


def get_tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def log_login_activity(request, user: User, success: bool = True) -> LoginActivity:
    ip = get_client_ip(request)
    location = get_location_from_ip(ip)

    if success and user:
        user.last_login_ip = ip
        user.last_login_location = location
        user.save(update_fields=["last_login_ip", "last_login_location", "updated_at"])

    return LoginActivity.objects.create(
        user=user,
        ip_address=ip,
        user_agent=get_user_agent(request),
        location=location,
        success=success,
    )
