import sys

from .base import *  # noqa: F401,F403

DEBUG = True

if env.bool("USE_SQLITE", default=False):  # noqa: F405
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405

if "test" in sys.argv:
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]  # noqa: F405

MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa: F405

if "test" in sys.argv:
    MIDDLEWARE = [mw for mw in MIDDLEWARE if mw != "debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405

INTERNAL_IPS = ["127.0.0.1", "localhost"]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: not request.path.startswith("/api/"),
}

# Run Celery tasks synchronously in local dev (no worker required)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use in-memory cache when Redis is not running locally
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "ustawi-dev",
    }
}
