from django.db.models import Count

from apps.verification.models import VerificationCase, VerificationCaseStatus


def get_pipeline_stats():
    counts = (
        VerificationCase.objects.exclude(status=VerificationCaseStatus.APPROVED)
        .values("status")
        .annotate(count=Count("id"))
    )
    by_status = {row["status"]: row["count"] for row in counts}

    return {
        "pending": by_status.get(VerificationCaseStatus.PENDING, 0),
        "in_review": by_status.get(VerificationCaseStatus.IN_REVIEW, 0),
        "awaiting_docs": by_status.get(VerificationCaseStatus.AWAITING_DOCS, 0),
        "rejected": by_status.get(VerificationCaseStatus.REJECTED, 0),
        "total_open": sum(by_status.values()),
        "breakdown": [
            {"status": status, "count": by_status.get(status, 0)}
            for status in [
                VerificationCaseStatus.PENDING,
                VerificationCaseStatus.IN_REVIEW,
                VerificationCaseStatus.AWAITING_DOCS,
                VerificationCaseStatus.REJECTED,
            ]
        ],
    }
