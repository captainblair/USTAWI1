from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import PasswordResetToken, RegistrationSession
from apps.accounts.serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterProfileSerializer,
    RegisterRoleSerializer,
    RegisterSendOTPSerializer,
    RegisterVerifyOTPSerializer,
    UserSerializer,
)
from apps.accounts.services.otp_service import OTPService
from apps.accounts.services.registration import (
    complete_registration,
    create_registration_session,
    get_tokens_for_user,
    log_login_activity,
    update_registration_profile,
)
from apps.accounts.services.google_auth import (
    GoogleAccountNotFoundError,
    GoogleAuthError,
    authenticate_or_register_with_google,
)
from core.throttling import AuthRateThrottle

User = get_user_model()


class RegisterRoleView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Step 1 — Select registration role", request=RegisterRoleSerializer)
    def post(self, request):
        serializer = RegisterRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = create_registration_session(role=serializer.validated_data["role"])

        return Response(
            {
                "success": True,
                "message": "Role selected. Proceed to profile details.",
                "data": {
                    "registration_token": str(session.id),
                    "role": session.role,
                    "step": session.step,
                    "expires_at": session.expires_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterProfileView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Step 2 — Submit profile and credentials", request=RegisterProfileSerializer)
    def post(self, request):
        serializer = RegisterProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["registration_token"]
        session = RegistrationSession.objects.get(id=token)
        update_registration_profile(session, serializer.validated_data)

        otp_service = OTPService()
        try:
            dev_otp = otp_service.send_registration_otp(session)
        except ValueError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "registration_token": str(session.id),
            "step": session.step,
            "phone": session.phone,
            "otp_expires_in_minutes": settings.OTP_EXPIRY_MINUTES,
        }
        if dev_otp:
            data["dev_otp"] = dev_otp

        return Response(
            {
                "success": True,
                "message": "Profile saved. Enter the verification code sent to your phone.",
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class RegisterSendOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Step 3 — Send phone OTP", request=RegisterSendOTPSerializer)
    def post(self, request):
        serializer = RegisterSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = RegistrationSession.objects.get(id=serializer.validated_data["registration_token"])
        otp_service = OTPService()
        try:
            dev_otp = otp_service.send_registration_otp(session)
        except ValueError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "registration_token": str(session.id),
            "step": session.step,
            "phone": session.phone,
            "otp_expires_in_minutes": settings.OTP_EXPIRY_MINUTES,
        }
        if dev_otp:
            data["dev_otp"] = dev_otp

        return Response(
            {
                "success": True,
                "message": "OTP sent to your phone.",
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class RegisterVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Step 4 — Verify OTP and complete registration", request=RegisterVerifyOTPSerializer)
    def post(self, request):
        serializer = RegisterVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = RegistrationSession.objects.get(id=serializer.validated_data["registration_token"])
        otp_service = OTPService()

        try:
            verified = otp_service.verify_registration_otp(session, serializer.validated_data["otp"])
        except ValueError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not verified:
            return Response(
                {"success": False, "error": {"message": "Invalid OTP code."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = complete_registration(session)
        tokens = get_tokens_for_user(user)
        log_login_activity(request, user, success=True)

        return Response(
            {
                "success": True,
                "message": "Registration complete.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Login with email and password", request=LoginSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)

        if user is None:
            try:
                failed_user = User.objects.get(email=email)
                log_login_activity(request, failed_user, success=False)
            except User.DoesNotExist:
                pass
            return Response(
                {"success": False, "error": {"message": "Invalid email or password."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"success": False, "error": {"message": "Account is disabled."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = get_tokens_for_user(user)
        log_login_activity(request, user, success=True)

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                },
            },
            status=status.HTTP_200_OK,
        )


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Sign in or sign up with Google ID token", request=GoogleAuthSerializer)
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role = serializer.validated_data.get("role")

        try:
            user, created = authenticate_or_register_with_google(
                serializer.validated_data["id_token"],
                role=role,
            )
        except GoogleAccountNotFoundError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc), "code": "account_not_found"}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except GoogleAuthError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"success": False, "error": {"message": "Account is disabled."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = get_tokens_for_user(user)
        log_login_activity(request, user, success=True)

        return Response(
            {
                "success": True,
                "message": "Registration complete." if created else "Login successful.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                    "is_new_user": created,
                },
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"], summary="Logout and blacklist refresh token", request=LogoutSerializer)
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"message": "Refresh token is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"success": False, "error": {"message": "Invalid or expired refresh token."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(tags=["Auth"], summary="Request password reset email", request=PasswordResetRequestSerializer)
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            pass
        else:
            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timezone.timedelta(hours=1),
            )
            reset_url = f"{settings.FRONTEND_PASSWORD_RESET_URL}?token={reset_token.token}"
            send_mail(
                subject="Reset your Ustawi password",
                message=f"Click the link to reset your password: {reset_url}\n\nThis link expires in 1 hour.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return Response(
            {
                "success": True,
                "message": "If an account exists with that email, a reset link has been sent.",
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Auth"], summary="Confirm password reset with token", request=PasswordResetConfirmSerializer)
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(
                token=serializer.validated_data["token"]
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"success": False, "error": {"message": "Invalid reset token."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reset_token.is_valid:
            return Response(
                {"success": False, "error": {"message": "Reset token has expired or was already used."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password", "updated_at"])

        reset_token.is_used = True
        reset_token.save(update_fields=["is_used", "updated_at"])

        return Response(
            {"success": True, "message": "Password reset successful. You can now log in."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"], summary="Get current authenticated user")
    def get(self, request):
        return Response(
            {"success": True, "data": UserSerializer(request.user).data},
            status=status.HTTP_200_OK,
        )


class TokenRefreshViewWithSchema(TokenRefreshView):
    @extend_schema(tags=["Auth"], summary="Refresh access token")
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.data = {"success": True, "data": {"tokens": response.data}}
        return response
