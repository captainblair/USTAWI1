from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.services.presence import touch_last_seen


class JWTAuthenticationWithPresence(JWTAuthentication):
    """Record user activity for online/offline presence on authenticated requests."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            touch_last_seen(user)
        return result
