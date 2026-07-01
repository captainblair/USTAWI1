from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import Property, PropertyImage, PropertyStatus
from apps.properties.permissions import IsLandlordAgentOrAdmin
from apps.properties.serializers import (
    PropertyCreateUpdateSerializer,
    PropertyDetailSerializer,
    PropertyImageUploadSerializer,
    PropertyListSerializer,
)
from core.pagination import StandardResultsSetPagination


class LandlordPropertyListCreateView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(tags=["Landlord Properties"], summary="List my properties")
    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = (
            Property.objects.filter(owner=request.user)
            .select_related("neighborhood")
            .prefetch_related("images", "amenities")
            .order_by("-updated_at")
        )
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = PropertyListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(tags=["Landlord Properties"], summary="Create a new property (draft)")
    def post(self, request):
        serializer = PropertyCreateUpdateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        prop = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Property created as draft.",
                "data": PropertyDetailSerializer(prop, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordPropertyDetailView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    def get_object(self, request, pk):
        return Property.objects.prefetch_related("images", "amenities", "documents").get(
            pk=pk, owner=request.user
        )

    @extend_schema(tags=["Landlord Properties"], summary="Get my property detail")
    def get(self, request, pk):
        prop = self.get_object(request, pk)
        return Response(
            {
                "success": True,
                "data": PropertyDetailSerializer(prop, context={"request": request}).data,
            }
        )

    @extend_schema(tags=["Landlord Properties"], summary="Update my property")
    def patch(self, request, pk):
        prop = self.get_object(request, pk)
        if prop.status not in (PropertyStatus.DRAFT, PropertyStatus.VACANT, PropertyStatus.REJECTED):
            return Response(
                {
                    "success": False,
                    "error": {"message": "Only draft, vacant, or rejected properties can be edited."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PropertyCreateUpdateSerializer(
            prop, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        prop = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Property updated.",
                "data": PropertyDetailSerializer(prop, context={"request": request}).data,
            }
        )

    @extend_schema(tags=["Landlord Properties"], summary="Delete my property (draft only)")
    def delete(self, request, pk):
        prop = self.get_object(request, pk)
        if prop.status != PropertyStatus.DRAFT:
            return Response(
                {"success": False, "error": {"message": "Only draft properties can be deleted."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prop.delete()
        return Response({"success": True, "message": "Property deleted."}, status=status.HTTP_200_OK)


class LandlordPropertyPublishView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Properties"], summary="Publish property for review")
    def post(self, request, pk):
        prop = Property.objects.get(pk=pk, owner=request.user)
        if prop.status not in (PropertyStatus.DRAFT, PropertyStatus.REJECTED, PropertyStatus.VACANT):
            return Response(
                {"success": False, "error": {"message": "Property cannot be published from current status."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not prop.images.exists():
            return Response(
                {"success": False, "error": {"message": "Add at least one image before publishing."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prop.status = PropertyStatus.PENDING_REVIEW
        prop.save(update_fields=["status", "updated_at"])
        from apps.verification.services.workflow import approve_case, create_verification_case

        case = create_verification_case(prop, actor=request.user)

        # Local dev: auto-approve so landlords can test listing → apply → lease flow without inspector UI.
        if settings.DEBUG and case:
            approve_case(case, request.user, notes="Auto-approved in DEBUG mode.")
            prop.refresh_from_db()
            return Response(
                {
                    "success": True,
                    "message": "Property published and activated (dev auto-approval).",
                    "data": {"id": str(prop.id), "status": prop.status},
                }
            )

        return Response(
            {
                "success": True,
                "message": "Property submitted for verification review.",
                "data": {"id": str(prop.id), "status": prop.status},
            }
        )


class LandlordPropertyArchiveView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Properties"], summary="Archive (deactivate) a property")
    def post(self, request, pk):
        prop = Property.objects.get(pk=pk, owner=request.user)
        prop.status = PropertyStatus.DRAFT
        prop.is_featured = False
        prop.save(update_fields=["status", "is_featured", "updated_at"])
        return Response(
            {
                "success": True,
                "message": "Property archived to draft.",
                "data": {"id": str(prop.id), "status": prop.status},
            }
        )


class LandlordPropertyActivateView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Properties"], summary="Mark property as active (post-verification stub)")
    def post(self, request, pk):
        """Admin/inspector will activate in Phase 4; landlords can re-list vacant units."""
        prop = Property.objects.get(pk=pk, owner=request.user)
        if prop.status != PropertyStatus.VACANT:
            return Response(
                {"success": False, "error": {"message": "Only vacant properties can be re-listed."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prop.status = PropertyStatus.PENDING_REVIEW
        prop.save(update_fields=["status", "updated_at"])
        from apps.verification.services.workflow import create_verification_case

        create_verification_case(prop, actor=request.user)
        return Response(
            {
                "success": True,
                "message": "Property submitted for re-listing review.",
                "data": {"id": str(prop.id), "status": prop.status},
            }
        )


class LandlordPropertyImageView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["Landlord Properties"], summary="Upload property image")
    def post(self, request, pk):
        prop = Property.objects.get(pk=pk, owner=request.user)
        serializer = PropertyImageUploadSerializer(
            data=request.data, context={"property": prop, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Image uploaded.",
                "data": PropertyImageUploadSerializer(image).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordPropertyImageDeleteView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Properties"], summary="Delete property image")
    def delete(self, request, pk, image_id):
        prop = Property.objects.get(pk=pk, owner=request.user)
        image = PropertyImage.objects.get(pk=image_id, property=prop)
        was_primary = image.is_primary
        image.image.delete(save=False)
        image.delete()
        if was_primary:
            next_image = PropertyImage.objects.filter(property=prop).order_by("sort_order", "created_at").first()
            if next_image:
                next_image.is_primary = True
                next_image.save(update_fields=["is_primary"])
        return Response({"success": True, "message": "Image deleted."})


class LandlordPropertyImageSetPrimaryView(APIView):
    permission_classes = [IsLandlordAgentOrAdmin]

    @extend_schema(tags=["Landlord Properties"], summary="Set property main (hero) photo")
    def post(self, request, pk, image_id):
        prop = Property.objects.get(pk=pk, owner=request.user)
        image = PropertyImage.objects.get(pk=image_id, property=prop)
        PropertyImage.objects.filter(property=prop).exclude(pk=image.pk).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=["is_primary"])
        return Response(
            {
                "success": True,
                "message": "Main photo updated.",
                "data": {"id": str(image.id), "is_primary": True},
            }
        )
