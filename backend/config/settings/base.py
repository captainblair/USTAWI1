from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/

env = environ.Env(
    DEBUG=(bool, False),
    JWT_ACCESS_TOKEN_LIFETIME_MINUTES=(int, 60),
    JWT_REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
    OTP_LENGTH=(int, 6),
    OTP_EXPIRY_MINUTES=(int, 10),
)

environ.Env.read_env(BASE_DIR / ".env")

USE_POSTGIS = env.bool("USE_POSTGIS", default=True)

SECRET_KEY = env("SECRET_KEY", default="insecure-dev-key-change-in-production")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    # Local
    "core",
    "apps.accounts",
    "apps.properties",
    "apps.applications",
    "apps.verification",
    "apps.leases",
    "apps.payments",
    "apps.maintenance",
    "apps.notifications",
    "apps.support",
    "apps.analytics",
]

if USE_POSTGIS:
    INSTALLED_APPS.insert(6, "django.contrib.gis")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "core.middleware.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgresql://ustawi:ustawi@localhost:5432/ustawi",
    )
}
if USE_POSTGIS:
    DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"
else:
    DATABASES["default"]["ENGINE"] = "django.db.backends.postgresql"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.JWTAuthenticationWithPresence",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "core.throttling.AnonBurstRateThrottle",
        "core.throttling.UserBurstRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "anon_burst": "30/minute",
        "user": "1000/hour",
        "user_burst": "120/minute",
        "auth": "10/minute",
    },
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1"],
    "VERSION_PARAM": "version",
}

from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env("JWT_ACCESS_TOKEN_LIFETIME_MINUTES")),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env("JWT_REFRESH_TOKEN_LIFETIME_DAYS")),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Ustawi API",
    "DESCRIPTION": "Verified rental and housing platform API for Kenya.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "TAGS": [
        {"name": "Health", "description": "Service health checks"},
        {"name": "Auth", "description": "Authentication and registration"},
        {"name": "Profile", "description": "User profile and preferences"},
        {"name": "Privacy", "description": "Data export and account deletion (Kenya DPA)"},
        {"name": "Properties", "description": "Public property search and listings"},
        {"name": "Landlord Properties", "description": "Landlord property management"},
        {"name": "Saved Properties", "description": "Tenant saved homes"},
        {"name": "Applications", "description": "Tenant rental applications"},
        {"name": "Landlord Applications", "description": "Landlord application inbox"},
        {"name": "Verification", "description": "Inspector verification queue and scoring"},
        {"name": "Admin Verification", "description": "Admin verification pipeline stats"},
        {"name": "Community Reports", "description": "Property community reports"},
        {"name": "Leases", "description": "Tenant lease contracts and signatures"},
        {"name": "Landlord Leases", "description": "Landlord lease management"},
        {"name": "Payments", "description": "Tenant rent payments and receipts"},
        {"name": "Landlord Payments", "description": "Landlord payment collection and billing"},
        {"name": "Maintenance", "description": "Tenant maintenance requests"},
        {"name": "Landlord Maintenance", "description": "Landlord maintenance management"},
        {"name": "Notifications", "description": "In-app notifications and activity feed"},
        {"name": "Support", "description": "Disputes, support cases, and knowledge base"},
        {"name": "Admin Support", "description": "Admin support case management"},
        {"name": "Analytics", "description": "Dashboard KPIs and chart data"},
    ],
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=CORS_ALLOWED_ORIGINS)

from config.redis_url import ensure_redis_ssl_cert_reqs

# Upstash / managed Redis use rediss://; Celery requires ssl_cert_reqs on those URLs.
_REDIS_SSL_CERT_REQS = env("REDIS_SSL_CERT_REQS", default="CERT_REQUIRED")

REDIS_URL = ensure_redis_ssl_cert_reqs(
    env("REDIS_URL", default="redis://localhost:6379/0"),
    cert_reqs=_REDIS_SSL_CERT_REQS,
)

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

CELERY_BROKER_URL = ensure_redis_ssl_cert_reqs(
    env("CELERY_BROKER_URL", default="redis://localhost:6379/1"),
    cert_reqs=_REDIS_SSL_CERT_REQS,
)
CELERY_RESULT_BACKEND = ensure_redis_ssl_cert_reqs(
    env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2"),
    cert_reqs=_REDIS_SSL_CERT_REQS,
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
# Notifications / receipts are fire-and-forget; avoid requiring a working result store.
CELERY_TASK_IGNORE_RESULT = True

# M-Pesa Daraja — leave blank for dev-mode STK simulation
MPESA_CONSUMER_KEY = env("MPESA_CONSUMER_KEY", default="")
MPESA_CONSUMER_SECRET = env("MPESA_CONSUMER_SECRET", default="")
MPESA_SHORTCODE = env("MPESA_SHORTCODE", default="")
MPESA_PASSKEY = env("MPESA_PASSKEY", default="")
MPESA_CALLBACK_URL = env(
    "MPESA_CALLBACK_URL",
    default="http://localhost:8001/api/v1/payments/webhooks/mpesa/",
)
MPESA_ENVIRONMENT = env("MPESA_ENVIRONMENT", default="sandbox")

# Africa's Talking
AFRICAS_TALKING_USERNAME = env("AFRICAS_TALKING_USERNAME", default="")
AFRICAS_TALKING_API_KEY = env("AFRICAS_TALKING_API_KEY", default="")
AFRICAS_TALKING_SENDER_ID = env("AFRICAS_TALKING_SENDER_ID", default="USTAWI")
# Set SMS_ENABLED=false on Render until live SMS is approved.
AFRICAS_TALKING_SMS_ENABLED = env.bool("AFRICAS_TALKING_SMS_ENABLED", default=True)
AFRICAS_TALKING_SMS_TIMEOUT = env.int("AFRICAS_TALKING_SMS_TIMEOUT", default=6)
# Show OTP on the verify screen until real SMS delivery is confirmed.
REGISTRATION_OTP_IN_APP = env.bool("REGISTRATION_OTP_IN_APP", default=True)

OTP_LENGTH = env("OTP_LENGTH")
OTP_EXPIRY_MINUTES = env("OTP_EXPIRY_MINUTES")

# Google OAuth (Sign in with Google)
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")

# Homepage featured carousel — auto-selected from approved public listings
FEATURED_PROPERTY_LIMIT = env.int("FEATURED_PROPERTY_LIMIT", default=6)

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Ustawi <noreply@ustawikenya.com>")
FRONTEND_PASSWORD_RESET_URL = env(
    "FRONTEND_PASSWORD_RESET_URL",
    default="http://localhost:3000/reset-password",
)

# Media storage — local disk in dev; Cloudinary in production (Render disk is ephemeral).
CLOUDINARY_URL = env("CLOUDINARY_URL", default="")

if CLOUDINARY_URL:
    INSTALLED_APPS = [
        "cloudinary_storage",
        "cloudinary",
        *INSTALLED_APPS,
    ]
    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="")

SENTRY_DSN = env("SENTRY_DSN", default="")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="development")
SENTRY_TRACES_SAMPLE_RATE = env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "apps.accounts": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
