from django.urls import path

from apps.properties.views.landlord import (
    LandlordPropertyActivateView,
    LandlordPropertyArchiveView,
    LandlordPropertyDetailView,
    LandlordPropertyImageDeleteView,
    LandlordPropertyImageView,
    LandlordPropertyListCreateView,
    LandlordPropertyPublishView,
)
from apps.properties.views.public import (
    FeaturedPropertyListView,
    PropertyDetailView,
    PropertyFilterMetadataView,
    PropertyListView,
)
from apps.properties.views.saved import SavedPropertyDeleteView, SavedPropertyListCreateView

app_name = "properties"

urlpatterns = [
    path("", PropertyListView.as_view(), name="list"),
    path("featured/", FeaturedPropertyListView.as_view(), name="featured"),
    path("filters/", PropertyFilterMetadataView.as_view(), name="filters"),
    path("<str:identifier>/", PropertyDetailView.as_view(), name="detail"),
]

landlord_urlpatterns = [
    path("", LandlordPropertyListCreateView.as_view(), name="landlord-list"),
    path("<uuid:pk>/", LandlordPropertyDetailView.as_view(), name="landlord-detail"),
    path("<uuid:pk>/publish/", LandlordPropertyPublishView.as_view(), name="landlord-publish"),
    path("<uuid:pk>/archive/", LandlordPropertyArchiveView.as_view(), name="landlord-archive"),
    path("<uuid:pk>/activate/", LandlordPropertyActivateView.as_view(), name="landlord-activate"),
    path("<uuid:pk>/images/", LandlordPropertyImageView.as_view(), name="landlord-image-upload"),
    path(
        "<uuid:pk>/images/<uuid:image_id>/",
        LandlordPropertyImageDeleteView.as_view(),
        name="landlord-image-delete",
    ),
]

saved_urlpatterns = [
    path("", SavedPropertyListCreateView.as_view(), name="saved-list"),
    path("<uuid:property_id>/", SavedPropertyDeleteView.as_view(), name="saved-delete"),
]
