from django.core.management.base import BaseCommand

from apps.support.models import KnowledgeBaseArticle, KnowledgeBaseCategory

ARTICLES = [
    {
        "title": "How do I create an Ustawi account?",
        "slug": "how-to-create-account",
        "category": KnowledgeBaseCategory.GETTING_STARTED,
        "summary": "Step-by-step registration for tenants and landlords.",
        "content": "Register at ustawikenya.com, choose your role, complete your profile, and verify your phone with OTP.",
        "sort_order": 1,
    },
    {
        "title": "How do rental applications work?",
        "slug": "how-rental-applications-work",
        "category": KnowledgeBaseCategory.APPLICATIONS,
        "summary": "Submitting and tracking your rental application.",
        "content": "Browse verified listings, submit an application with income details, and track status in My Applications.",
        "sort_order": 1,
    },
    {
        "title": "How do I pay rent with M-Pesa?",
        "slug": "pay-rent-with-mpesa",
        "category": KnowledgeBaseCategory.PAYMENTS,
        "summary": "Pay rent via STK Push on Ustawi.",
        "content": "Go to Payments, select your active lease, and tap Pay Now. Approve the M-Pesa prompt on your phone.",
        "sort_order": 1,
    },
    {
        "title": "How do I report a maintenance issue?",
        "slug": "report-maintenance-issue",
        "category": KnowledgeBaseCategory.MAINTENANCE,
        "summary": "Submit maintenance requests with photos.",
        "content": "Open Maintenance, describe the issue, attach up to 5 photos, and submit. Your landlord will be notified.",
        "sort_order": 1,
    },
    {
        "title": "What does a verified listing mean?",
        "slug": "verified-listing-meaning",
        "category": KnowledgeBaseCategory.VERIFICATION,
        "summary": "Understanding Ustawi property verification.",
        "content": "Verified listings pass document review, photo verification, and safety scoring by Ustawi inspectors.",
        "sort_order": 1,
    },
    {
        "title": "How do I update my profile or notification settings?",
        "slug": "update-profile-notifications",
        "category": KnowledgeBaseCategory.ACCOUNT,
        "summary": "Manage your profile and alert preferences.",
        "content": "Go to Profile & Settings to update your details. Notification preferences control email and SMS alerts.",
        "sort_order": 1,
    },
]


class Command(BaseCommand):
    help = "Seed knowledge base FAQ articles."

    def handle(self, *args, **options):
        created = 0
        for article in ARTICLES:
            _, was_created = KnowledgeBaseArticle.objects.update_or_create(
                slug=article["slug"],
                defaults=article,
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Knowledge base ready ({created} new articles)."))
