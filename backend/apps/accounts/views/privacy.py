from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import AccountDeletionSerializer
from apps.accounts.services.privacy import delete_user_account, export_user_data, get_deletion_blockers


class DataExportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Privacy"],
        summary="Export personal data (Kenya Data Protection Act)",
        description="Returns a JSON bundle of all personal data held for the authenticated user.",
    )
    def get(self, request):
        return Response(
            {
                "success": True,
                "data": export_user_data(request.user),
            },
            status=status.HTTP_200_OK,
        )


class AccountDeletionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Privacy"],
        summary="Request account deletion",
        request=AccountDeletionSerializer,
        description=(
            "Anonymizes and deactivates the account after password confirmation. "
            "Blocked while active leases or property listings exist."
        ),
    )
    def post(self, request):
        serializer = AccountDeletionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        blockers = get_deletion_blockers(request.user)
        if blockers:
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "Account cannot be deleted while obligations are active.",
                        "blockers": blockers,
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            delete_user_account(
                request.user,
                reason=serializer.validated_data.get("reason", ""),
            )
        except ValueError as exc:
            return Response(
                {"success": False, "error": {"message": str(exc)}},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "success": True,
                "message": "Your account has been deactivated and personal data anonymized.",
            },
            status=status.HTTP_200_OK,
        )
