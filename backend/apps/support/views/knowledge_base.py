from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.support.models import KnowledgeBaseArticle, KnowledgeBaseCategory
from apps.support.serializers import KnowledgeBaseArticleSerializer, KnowledgeBaseListSerializer


class KnowledgeBaseListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Support"],
        summary="List knowledge base articles",
        parameters=[OpenApiParameter("category", str)],
    )
    def get(self, request):
        qs = KnowledgeBaseArticle.objects.filter(is_published=True)
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        articles = qs.order_by("category", "sort_order", "title")
        grouped = {}
        for cat, label in KnowledgeBaseCategory.choices:
            cat_articles = [a for a in articles if a.category == cat]
            if cat_articles:
                grouped[cat] = {
                    "label": label,
                    "articles": KnowledgeBaseListSerializer(cat_articles, many=True).data,
                }

        return Response(
            {
                "success": True,
                "data": {
                    "categories": [
                        {"category": k, "label": v["label"], "articles": v["articles"]}
                        for k, v in grouped.items()
                    ],
                    "articles": KnowledgeBaseListSerializer(articles, many=True).data,
                },
            }
        )


class KnowledgeBaseDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["Support"], summary="Get knowledge base article by slug")
    def get(self, request, slug):
        article = KnowledgeBaseArticle.objects.get(slug=slug, is_published=True)
        return Response(
            {
                "success": True,
                "data": KnowledgeBaseArticleSerializer(article).data,
            }
        )
