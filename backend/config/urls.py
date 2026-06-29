from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.verification.urls.verification import (
    admin_urlpatterns as verification_admin_urlpatterns,
)
from apps.verification.urls.verification import (
    community_urlpatterns as verification_community_urlpatterns,
)
from apps.verification.urls.verification import (
    inspector_urlpatterns as verification_inspector_urlpatterns,
)
from apps.applications.urls.applications import tenant_urlpatterns as application_tenant_urlpatterns
from apps.applications.urls.applications import landlord_urlpatterns as application_landlord_urlpatterns
from apps.leases.urls.leases import landlord_urlpatterns as lease_landlord_urlpatterns
from apps.leases.urls.leases import tenant_urlpatterns as lease_tenant_urlpatterns
from apps.payments.urls.payments import landlord_urlpatterns as payment_landlord_urlpatterns
from apps.payments.urls.payments import tenant_urlpatterns as payment_tenant_urlpatterns
from apps.payments.urls.payments import webhook_urlpatterns as payment_webhook_urlpatterns
from apps.maintenance.urls.maintenance import landlord_urlpatterns as maintenance_landlord_urlpatterns
from apps.maintenance.urls.maintenance import tenant_urlpatterns as maintenance_tenant_urlpatterns
from apps.properties.urls.properties import landlord_urlpatterns, saved_urlpatterns
from core.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/auth/", include("apps.accounts.urls.auth")),
    path("api/v1/profile/", include("apps.accounts.urls.profile")),
    path("api/v1/properties/", include("apps.properties.urls.properties")),
    path("api/v1/landlord/properties/", include(landlord_urlpatterns)),
    path("api/v1/saved-properties/", include(saved_urlpatterns)),
    path("api/v1/applications/", include(application_tenant_urlpatterns)),
    path("api/v1/landlord/applications/", include(application_landlord_urlpatterns)),
    path("api/v1/inspector/verification/", include(verification_inspector_urlpatterns)),
    path("api/v1/admin/verification/", include(verification_admin_urlpatterns)),
    path("api/v1/community-reports/", include(verification_community_urlpatterns)),
    path("api/v1/leases/", include(lease_tenant_urlpatterns)),
    path("api/v1/landlord/leases/", include(lease_landlord_urlpatterns)),
    path("api/v1/payments/", include(payment_tenant_urlpatterns)),
    path("api/v1/payments/webhooks/", include(payment_webhook_urlpatterns)),
    path("api/v1/landlord/payments/", include(payment_landlord_urlpatterns)),
    path("api/v1/maintenance/", include(maintenance_tenant_urlpatterns)),
    path("api/v1/landlord/maintenance/", include(maintenance_landlord_urlpatterns)),
    path("api/v1/notifications/", include("apps.notifications.urls.notifications")),
]

if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
            *urlpatterns,
        ]
    except ImportError:
        pass
