from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views.auth import (
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterProfileView,
    RegisterRoleView,
    RegisterSendOTPView,
    RegisterVerifyOTPView,
)

app_name = "auth"

urlpatterns = [
    path("register/role/", RegisterRoleView.as_view(), name="register-role"),
    path("register/profile/", RegisterProfileView.as_view(), name="register-profile"),
    path("register/send-otp/", RegisterSendOTPView.as_view(), name="register-send-otp"),
    path("register/verify/", RegisterVerifyOTPView.as_view(), name="register-verify"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
