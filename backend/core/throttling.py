from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class AnonBurstRateThrottle(AnonRateThrottle):
    scope = "anon_burst"


class AnonSustainedRateThrottle(AnonRateThrottle):
    scope = "anon"


class UserBurstRateThrottle(UserRateThrottle):
    scope = "user_burst"


class UserSustainedRateThrottle(UserRateThrottle):
    scope = "user"


class AuthRateThrottle(SimpleRateThrottle):
    """Strict throttle for login, registration, and OTP endpoints."""

    scope = "auth"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
