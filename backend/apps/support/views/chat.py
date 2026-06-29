from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.support.models import ChatSessionStatus, LiveChatMessage, LiveChatSession
from apps.support.serializers import (
    LiveChatMessageCreateSerializer,
    LiveChatMessageSerializer,
    LiveChatSessionCreateSerializer,
    LiveChatSessionSerializer,
)


class LiveChatSessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Support"],
        summary="Start a live chat session",
        request=LiveChatSessionCreateSerializer,
    )
    def post(self, request):
        serializer = LiveChatSessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = LiveChatSession.objects.create(
            user=request.user,
            subject=serializer.validated_data.get("subject", ""),
        )
        LiveChatMessage.objects.create(
            session=session,
            sender=None,
            body="Welcome to Ustawi Support. How can we help you today?",
            is_agent=True,
        )
        return Response(
            {
                "success": True,
                "message": "Chat session started.",
                "data": LiveChatSessionSerializer(session).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LiveChatMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Support"], summary="List chat messages")
    def get(self, request, pk):
        session = LiveChatSession.objects.get(pk=pk, user=request.user)
        messages = session.messages.select_related("sender", "sender__profile")
        return Response(
            {
                "success": True,
                "data": LiveChatMessageSerializer(messages, many=True).data,
            }
        )

    @extend_schema(
        tags=["Support"],
        summary="Send chat message",
        request=LiveChatMessageCreateSerializer,
    )
    def post(self, request, pk):
        session = LiveChatSession.objects.get(pk=pk, user=request.user)
        if session.status == ChatSessionStatus.CLOSED:
            return Response(
                {"success": False, "error": {"message": "Chat session is closed."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LiveChatMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = LiveChatMessage.objects.create(
            session=session,
            sender=request.user,
            body=serializer.validated_data["body"],
            is_agent=False,
        )
        return Response(
            {
                "success": True,
                "data": LiveChatMessageSerializer(msg).data,
            },
            status=status.HTTP_201_CREATED,
        )
