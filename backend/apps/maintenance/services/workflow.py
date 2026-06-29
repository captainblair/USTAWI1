from django.utils import timezone

from apps.leases.models import Lease, LeaseStatus
from apps.maintenance.models import (
    MaintenanceRequest,
    MaintenanceStatus,
    MaintenanceUpdate,
    MaintenanceUpdateType,
    MAX_PHOTOS_PER_REQUEST,
)

ACTIVE_LEASE_STATUSES = (LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON)

VALID_STATUS_TRANSITIONS = {
    MaintenanceStatus.PENDING: {MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CLOSED},
    MaintenanceStatus.ASSIGNED: {MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED},
    MaintenanceStatus.IN_PROGRESS: {MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED},
    MaintenanceStatus.RESOLVED: {MaintenanceStatus.CLOSED, MaintenanceStatus.IN_PROGRESS},
    MaintenanceStatus.CLOSED: set(),
}


class MaintenanceWorkflowError(Exception):
    pass


def log_update(request_obj, actor, update_type, message="", old_status="", new_status="", metadata=None):
    return MaintenanceUpdate.objects.create(
        request=request_obj,
        actor=actor,
        update_type=update_type,
        old_status=old_status,
        new_status=new_status,
        message=message,
        metadata=metadata or {},
    )


def validate_active_lease(lease: Lease, tenant) -> Lease:
    if lease.tenant_id != tenant.id:
        raise MaintenanceWorkflowError("You can only report maintenance for your own lease.")
    if lease.status not in ACTIVE_LEASE_STATUSES:
        raise MaintenanceWorkflowError("Maintenance requests require an active lease.")
    return lease


def create_maintenance_request(tenant, lease: Lease, data: dict) -> MaintenanceRequest:
    validate_active_lease(lease, tenant)
    prop = lease.property

    request_obj = MaintenanceRequest.objects.create(
        tenant=tenant,
        landlord=lease.landlord,
        property=prop,
        lease=lease,
        unit_label=data.get("unit_label") or prop.address or prop.title,
        title=data["title"],
        description=data["description"],
        category=data["category"],
        urgency=data.get("urgency", "MEDIUM"),
        status=MaintenanceStatus.PENDING,
    )
    log_update(
        request_obj,
        tenant,
        MaintenanceUpdateType.CREATED,
        message="Maintenance request submitted.",
    )
    from apps.notifications.services.triggers import notify_maintenance_created

    notify_maintenance_created(request_obj)
    return request_obj


def assign_technician(request_obj: MaintenanceRequest, actor, name: str, phone: str = "", note: str = ""):
    if request_obj.status == MaintenanceStatus.CLOSED:
        raise MaintenanceWorkflowError("Closed requests cannot be assigned.")

    old_status = request_obj.status
    request_obj.assigned_technician_name = name
    request_obj.assigned_technician_phone = phone
    request_obj.assigned_at = timezone.now()
    if request_obj.status == MaintenanceStatus.PENDING:
        request_obj.status = MaintenanceStatus.ASSIGNED
    request_obj.save()

    log_update(
        request_obj,
        actor,
        MaintenanceUpdateType.ASSIGNMENT,
        message=note or f"Technician assigned: {name}",
        old_status=old_status,
        new_status=request_obj.status,
        metadata={"technician_name": name, "technician_phone": phone},
    )
    from apps.notifications.services.triggers import notify_maintenance_updated

    notify_maintenance_updated(
        request_obj,
        note or f"Technician {name} has been assigned to your request.",
        request_obj.tenant,
    )
    return request_obj


def update_status(request_obj: MaintenanceRequest, actor, new_status: str, message: str = ""):
    if new_status == request_obj.status:
        return request_obj

    allowed = VALID_STATUS_TRANSITIONS.get(request_obj.status, set())
    if new_status not in allowed:
        raise MaintenanceWorkflowError(
            f"Cannot transition from {request_obj.status} to {new_status}."
        )

    old_status = request_obj.status
    request_obj.status = new_status

    if new_status == MaintenanceStatus.RESOLVED:
        request_obj.resolved_at = timezone.now()
    elif new_status == MaintenanceStatus.CLOSED:
        request_obj.closed_at = timezone.now()

    request_obj.save()

    log_update(
        request_obj,
        actor,
        MaintenanceUpdateType.STATUS_CHANGE,
        message=message or f"Status updated to {new_status}.",
        old_status=old_status,
        new_status=new_status,
    )
    from apps.notifications.services.triggers import notify_maintenance_updated

    recipient = request_obj.tenant if actor.id == request_obj.landlord_id else request_obj.landlord
    notify_maintenance_updated(
        request_obj,
        message or f"Status updated to {new_status}.",
        recipient,
    )
    return request_obj


def validate_photo_upload(request_obj: MaintenanceRequest, new_count: int = 1):
    current = request_obj.photos.count()
    if current + new_count > MAX_PHOTOS_PER_REQUEST:
        raise MaintenanceWorkflowError(f"Maximum {MAX_PHOTOS_PER_REQUEST} photos per request.")
