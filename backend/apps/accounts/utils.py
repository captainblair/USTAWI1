def get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_user_agent(request) -> str:
    return request.META.get("HTTP_USER_AGENT", "")[:500]


def get_location_from_ip(ip_address: str | None) -> str:
    """Placeholder geolocation — replace with ip-api or similar in production."""
    if not ip_address or ip_address in ("127.0.0.1", "::1"):
        return "Nairobi, Kenya"
    return "Kenya"
