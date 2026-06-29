from django.urls import path

from apps.accounts.views.privacy import AccountDeletionView, DataExportView
from apps.accounts.views.profile import (
    LoginActivityListView,
    NotificationPreferenceView,
    ProfileView,
)

app_name = "profile"

urlpatterns = [
    path("", ProfileView.as_view(), name="profile"),
    path("notifications/", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("login-activity/", LoginActivityListView.as_view(), name="login-activity"),
    path("data-export/", DataExportView.as_view(), name="data-export"),
    path("delete-account/", AccountDeletionView.as_view(), name="delete-account"),
]
