from django.urls import path

from apps.support.views.admin import (
    AdminSupportCaseDetailView,
    AdminSupportCaseEscalateView,
    AdminSupportCaseListView,
    AdminSupportCaseMessageView,
    AdminSupportCaseUpdateView,
)
from apps.support.views.cases import (
    SupportCaseAttachmentView,
    SupportCaseDetailView,
    SupportCaseListCreateView,
    SupportCaseMessageView,
)
from apps.support.views.chat import LiveChatMessageListCreateView, LiveChatSessionCreateView
from apps.support.views.knowledge_base import KnowledgeBaseDetailView, KnowledgeBaseListView

user_urlpatterns = [
    path("cases/", SupportCaseListCreateView.as_view(), name="support-case-list"),
    path("cases/<uuid:pk>/", SupportCaseDetailView.as_view(), name="support-case-detail"),
    path("cases/<uuid:pk>/messages/", SupportCaseMessageView.as_view(), name="support-case-message"),
    path("cases/<uuid:pk>/attachments/", SupportCaseAttachmentView.as_view(), name="support-case-attachment"),
    path("kb/", KnowledgeBaseListView.as_view(), name="knowledge-base-list"),
    path("kb/<slug:slug>/", KnowledgeBaseDetailView.as_view(), name="knowledge-base-detail"),
    path("chat/sessions/", LiveChatSessionCreateView.as_view(), name="chat-session-create"),
    path("chat/sessions/<uuid:pk>/messages/", LiveChatMessageListCreateView.as_view(), name="chat-messages"),
]

admin_urlpatterns = [
    path("cases/", AdminSupportCaseListView.as_view(), name="admin-support-case-list"),
    path("cases/<uuid:pk>/", AdminSupportCaseDetailView.as_view(), name="admin-support-case-detail"),
    path("cases/<uuid:pk>/status/", AdminSupportCaseUpdateView.as_view(), name="admin-support-case-update"),
    path("cases/<uuid:pk>/escalate/", AdminSupportCaseEscalateView.as_view(), name="admin-support-case-escalate"),
    path("cases/<uuid:pk>/messages/", AdminSupportCaseMessageView.as_view(), name="admin-support-case-message"),
]
