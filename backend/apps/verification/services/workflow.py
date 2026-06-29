from decimal import Decimal

from django.utils import timezone

from apps.properties.models import PropertyStatus
from apps.verification.models import (
    AuditLog,
    DocumentReviewStatus,
    SafetyFactorType,
    SafetyScore,
    SafetyScoreFactor,
    VerificationCase,
    VerificationCaseStatus,
    VerificationDocType,
    VerificationDocument,
    VerificationStage,
)


def log_audit(case, actor, action, message="", metadata=None, property_obj=None):
    return AuditLog.objects.create(
        case=case,
        property=property_obj or case.property,
        actor=actor,
        action=action,
        message=message,
        metadata=metadata or {},
    )


def create_verification_case(property_obj, actor=None) -> VerificationCase:
    case, created = VerificationCase.objects.get_or_create(
        property=property_obj,
        defaults={
            "status": VerificationCaseStatus.PENDING,
            "stage": VerificationStage.DOCUMENT_REVIEW,
        },
    )
    if not created and case.status in (
        VerificationCaseStatus.REJECTED,
        VerificationCaseStatus.APPROVED,
    ):
        case.status = VerificationCaseStatus.PENDING
        case.stage = VerificationStage.DOCUMENT_REVIEW
        case.rejection_reason = ""
        case.changes_requested = ""
        case.completed_at = None
        case.save()

    if created:
        _bootstrap_documents(case)
        log_audit(case, actor, "CASE_CREATED", "Verification case opened.")

    return case


def _bootstrap_documents(case: VerificationCase):
    required = [
        VerificationDocType.TITLE_DEED,
        VerificationDocType.TAX_INFO,
        VerificationDocType.CONTRACT,
        VerificationDocType.ID_PASSPORT,
    ]
    for doc_type in required:
        VerificationDocument.objects.get_or_create(
            case=case,
            doc_type=doc_type,
            defaults={"title": doc_type.label},
        )

    for prop_doc in case.property.documents.all():
        vtype = _map_property_doc_type(prop_doc.doc_type)
        VerificationDocument.objects.get_or_create(
            case=case,
            doc_type=vtype,
            defaults={
                "title": prop_doc.title,
                "property_document": prop_doc,
                "file": prop_doc.document,
            },
        )


def _map_property_doc_type(doc_type: str) -> str:
    mapping = {
        "TITLE_DEED": VerificationDocType.TITLE_DEED,
        "LEASE": VerificationDocType.CONTRACT,
    }
    return mapping.get(doc_type, VerificationDocType.OTHER)


FACTOR_CONFIG = {
    SafetyFactorType.NEIGHBORHOOD: {"max": Decimal("10"), "weight": Decimal("0.25")},
    SafetyFactorType.BUILDING_CONDITION: {"max": Decimal("100"), "weight": Decimal("0.25")},
    SafetyFactorType.ACCESS_CONTROL: {"max": Decimal("100"), "weight": Decimal("0.20")},
    SafetyFactorType.LIGHTING: {"max": Decimal("10"), "weight": Decimal("0.15")},
    SafetyFactorType.EMERGENCY_READINESS: {"max": Decimal("100"), "weight": Decimal("0.15")},
}


def normalize_factor_score(factor_type: str, score: Decimal) -> Decimal:
    config = FACTOR_CONFIG[factor_type]
    max_score = config["max"]
    if max_score == 0:
        return Decimal("0")
    normalized = (score / max_score) * Decimal("10")
    return min(Decimal("10"), max(normalized, Decimal("0")))


def compute_overall_score(factors: dict) -> Decimal:
    total = Decimal("0")
    for factor_type, score in factors.items():
        config = FACTOR_CONFIG.get(factor_type)
        if not config:
            continue
        normalized = normalize_factor_score(factor_type, Decimal(str(score)))
        total += normalized * config["weight"]
    return round(total, 1)


def save_safety_score(case: VerificationCase, factors: dict, actor, notes: str = "") -> SafetyScore:
    overall = compute_overall_score(factors)
    safety, _ = SafetyScore.objects.update_or_create(
        property=case.property,
        defaults={
            "case": case,
            "overall_score": overall,
            "scored_by": actor,
            "notes": notes,
        },
    )

    for factor_type, score in factors.items():
        config = FACTOR_CONFIG.get(factor_type, {"max": Decimal("10")})
        SafetyScoreFactor.objects.update_or_create(
            safety_score=safety,
            factor_type=factor_type,
            defaults={
                "score": Decimal(str(score)),
                "max_score": config["max"],
            },
        )

    case.property.safety_score = overall
    case.property.save(update_fields=["safety_score", "updated_at"])
    log_audit(
        case,
        actor,
        "SAFETY_SCORED",
        f"Safety score set to {overall}/10.",
        metadata={"overall_score": float(overall), "factors": factors},
    )
    return safety


def approve_case(case: VerificationCase, actor, notes: str = "") -> VerificationCase:
    case.status = VerificationCaseStatus.APPROVED
    case.stage = VerificationStage.FINAL_REVIEW
    case.completed_at = timezone.now()
    case.inspector_notes = notes or case.inspector_notes
    case.assigned_inspector = case.assigned_inspector or actor
    case.save()

    prop = case.property
    prop.status = PropertyStatus.ACTIVE
    prop.is_verified = True
    prop.published_at = prop.published_at or timezone.now()
    prop.save(update_fields=["status", "is_verified", "published_at", "updated_at"])

    owner_profile = prop.owner.profile
    owner_profile.is_verified_landlord = True
    owner_profile.save(update_fields=["is_verified_landlord", "updated_at"])

    log_audit(case, actor, "CASE_APPROVED", notes or "Property approved and verified.")
    return case


def reject_case(case: VerificationCase, actor, reason: str = "") -> VerificationCase:
    case.status = VerificationCaseStatus.REJECTED
    case.completed_at = timezone.now()
    case.rejection_reason = reason
    case.assigned_inspector = case.assigned_inspector or actor
    case.save()

    prop = case.property
    prop.status = PropertyStatus.REJECTED
    prop.is_verified = False
    prop.save(update_fields=["status", "is_verified", "updated_at"])

    log_audit(case, actor, "CASE_REJECTED", reason or "Property verification rejected.")
    return case


def request_changes(case: VerificationCase, actor, message: str = "") -> VerificationCase:
    case.status = VerificationCaseStatus.AWAITING_DOCS
    case.changes_requested = message
    case.assigned_inspector = case.assigned_inspector or actor
    case.save()

    prop = case.property
    prop.status = PropertyStatus.PENDING_REVIEW
    prop.save(update_fields=["status", "updated_at"])

    log_audit(case, actor, "CHANGES_REQUESTED", message or "Inspector requested changes.")
    return case


def start_review(case: VerificationCase, actor) -> VerificationCase:
    case.status = VerificationCaseStatus.IN_REVIEW
    case.assigned_inspector = actor
    case.save(update_fields=["status", "assigned_inspector", "updated_at"])
    log_audit(case, actor, "REVIEW_STARTED", "Inspector started review.")
    return case


def review_document(vdoc: VerificationDocument, actor, status: str, notes: str = ""):
    vdoc.status = status
    vdoc.reviewer_notes = notes
    vdoc.reviewed_by = actor
    vdoc.reviewed_at = timezone.now()
    vdoc.save()
    log_audit(
        vdoc.case,
        actor,
        "DOCUMENT_REVIEWED",
        f"{vdoc.doc_type} marked {status}.",
        metadata={"document_id": str(vdoc.id), "status": status},
    )
    return vdoc
