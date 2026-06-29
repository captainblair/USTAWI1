from django.urls import path

from apps.notifications.views.notifications import (
    ActivityFeedView,
    NotificationBadgeView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("badge/", NotificationBadgeView.as_view(), name="notification-badge"),
    path("read-all/", NotificationMarkAllReadView.as_view(), name="notification-read-all"),
    path("activity/", ActivityFeedView.as_view(), name="activity-feed"),
    path("<uuid:pk>/read/", NotificationMarkReadView.as_view(), name="notification-read"),
]
