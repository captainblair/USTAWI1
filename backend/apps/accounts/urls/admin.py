from django.urls import path

from apps.accounts.views.admin_users import AdminUserDetailView, AdminUserListView

app_name = "admin_accounts"

urlpatterns = [
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
