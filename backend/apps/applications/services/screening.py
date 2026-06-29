from decimal import Decimal

from apps.applications.models import ApplicationEvent, ApplicationEventType, RentalApplication


def calculate_screening(application: RentalApplication) -> dict:
    """Rule-based tenant screening score (MVP until Phase 4 AI scoring)."""
    score = 50
    profile = application.tenant.profile
    rent = application.property.price_monthly or Decimal("1")
    income = application.monthly_income or Decimal("0")

    ratio = float(income / rent) if rent else 0.0

    if ratio >= 3.0:
        score += 30
    elif ratio >= 2.5:
        score += 22
    elif ratio >= 2.0:
        score += 12
    elif ratio >= 1.5:
        score += 0
    else:
        score -= 25

    if profile.id_document_verified:
        score += 10
    if profile.income_verified:
        score += 10
    if application.tenant.is_phone_verified:
        score += 5

    doc_count = application.documents.count()
    if doc_count >= 3:
        score += 8
    elif doc_count >= 1:
        score += 4

    ref_count = application.references.count()
    if ref_count >= 2:
        score += 5
    elif ref_count >= 1:
        score += 2

    score = max(0, min(100, score))
    label = _score_label(score, ratio)
    risk = _risk_level(score)

    return {
        "screening_score": score,
        "screening_label": label,
        "income_rent_ratio": round(ratio, 2),
        "risk_level": risk,
        "income_vs_rent_summary": _income_summary(ratio),
    }


def _score_label(score: int, ratio: float) -> str:
    if score >= 85:
        return "Low Risk – Excellent Tenant"
    if score >= 70:
        return "Low Risk"
    if score >= 50:
        return "Medium Risk"
    return "High Risk"


def _risk_level(score: int) -> str:
    if score >= 85:
        return "LOW"
    if score >= 70:
        return "LOW"
    if score >= 50:
        return "MEDIUM"
    return "HIGH"


def _income_summary(ratio: float) -> str:
    if ratio >= 3:
        return f"Income: {ratio:.1f}x Rent, Low Risk"
    if ratio >= 2:
        return f"Income: {ratio:.1f}x Rent, Acceptable"
    return f"Income: {ratio:.1f}x Rent, Below Recommended"


def apply_screening(application: RentalApplication) -> RentalApplication:
    result = calculate_screening(application)
    application.screening_score = result["screening_score"]
    application.screening_label = result["screening_label"]
    application.income_rent_ratio = result["income_rent_ratio"]
    application.save(
        update_fields=[
            "screening_score",
            "screening_label",
            "income_rent_ratio",
            "updated_at",
        ]
    )
    return application


def log_event(
    application: RentalApplication,
    event_type: str,
    actor=None,
    message: str = "",
    metadata: dict | None = None,
) -> ApplicationEvent:
    return ApplicationEvent.objects.create(
        application=application,
        event_type=event_type,
        actor=actor,
        message=message,
        metadata=metadata or {},
    )
