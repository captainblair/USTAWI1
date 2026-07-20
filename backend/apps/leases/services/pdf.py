"""
Generate property-specific lease agreement PDFs (real PDF bytes, not plain text).
"""

from __future__ import annotations

import io
import logging
from decimal import Decimal

from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.leases.models import Lease

logger = logging.getLogger(__name__)


def _is_valid_pdf_file(file_field) -> bool:
    if not file_field:
        return False
    try:
        with file_field.open("rb") as fh:
            return fh.read(5) == b"%PDF-"
    except Exception:
        return False


def _person_name(user) -> str:
    profile = getattr(user, "profile", None)
    if profile and profile.full_name:
        return profile.full_name
    return user.email


def _format_money(amount: Decimal | float, currency: str) -> str:
    value = float(amount)
    if currency == "KES":
        return f"KES {value:,.0f}"
    return f"{currency} {value:,.2f}"


def generate_lease_agreement_pdf(lease: Lease, *, signed: bool = False) -> ContentFile:
    """Build a multi-section residential lease PDF from lease + property + parties."""
    lease = (
        Lease.objects.select_related(
            "property",
            "property__neighborhood",
            "tenant",
            "tenant__profile",
            "landlord",
            "landlord__profile",
            "application",
        )
        .get(pk=lease.pk)
    )
    prop = lease.property
    tenant = lease.tenant
    landlord = lease.landlord
    neighborhood = prop.neighborhood.name if prop.neighborhood else prop.city

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Lease Agreement — {prop.title}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "LeaseTitle",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#1F2B6C"),
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "LeaseSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6B7280"),
        alignment=TA_CENTER,
        spaceAfter=16,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=11,
        textColor=colors.HexColor("#1F2B6C"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "LeaseBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    )
    small_style = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#4B5563"),
    )

    ref = str(lease.id)[:8].upper()
    generated_at = timezone.now().strftime("%d %B %Y")

    story = [
        Paragraph("RESIDENTIAL LEASE AGREEMENT", title_style),
        Paragraph(f"Reference: UST-{ref} · Generated {generated_at}", subtitle_style),
    ]

    summary_rows = [
        ["Property", prop.title],
        ["Address", f"{prop.address}, {neighborhood}, {prop.city}"],
        ["Property type", prop.get_property_type_display() if hasattr(prop, "get_property_type_display") else prop.property_type],
        ["Bedrooms / Bathrooms", f"{prop.bedrooms} bed · {prop.bathrooms} bath"],
        ["Furnished", "Yes" if lease.furnished else "No"],
        ["Landlord", _person_name(landlord)],
        ["Tenant", _person_name(tenant)],
        ["Lease term", f"{lease.start_date.strftime('%d %b %Y')} — {lease.end_date.strftime('%d %b %Y')} ({lease.duration_months} months)"],
        ["Monthly rent", _format_money(lease.rent_amount, lease.currency)],
        ["Rent due day", f"Day {lease.rent_due_day} of each month"],
        ["Security deposit", _format_money(lease.deposit_amount, lease.currency)],
    ]
    if lease.notes:
        summary_rows.append(["Additional notes", lease.notes])

    summary_table = Table(summary_rows, colWidths=[4.5 * cm, 12 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F7F8FC")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1F2B6C")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E8EAF2")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, 12))

    clauses = [
        (
            "1. Premises",
            f"The Landlord agrees to let and the Tenant agrees to take the premises described above "
            f"('{prop.title}') for residential use only, together with access to agreed amenities.",
        ),
        (
            "2. Term",
            f"The tenancy commences on {lease.start_date.strftime('%d %B %Y')} and ends on "
            f"{lease.end_date.strftime('%d %B %Y')} unless terminated earlier in accordance with this Agreement.",
        ),
        (
            "3. Rent",
            f"The Tenant shall pay {_format_money(lease.rent_amount, lease.currency)} per month, due on day "
            f"{lease.rent_due_day} of each calendar month, via M-Pesa or other method approved on the Ustawi platform.",
        ),
        (
            "4. Deposit",
            f"The Tenant has paid / shall pay a refundable security deposit of "
            f"{_format_money(lease.deposit_amount, lease.currency)} subject to lawful deductions for damage or unpaid rent.",
        ),
        (
            "5. Utilities & maintenance",
            "Unless otherwise agreed in writing, the Tenant is responsible for utilities consumed on the premises. "
            "The Tenant shall keep the premises clean and report maintenance issues promptly through Ustawi.",
        ),
        (
            "6. Subletting",
            "The Tenant shall not sublet, assign, or share possession of the premises without prior written consent of the Landlord.",
        ),
        (
            "7. Termination",
            "Either party may terminate in accordance with Kenyan tenancy law and any notice period agreed on the platform. "
            "Breach of material terms may entitle the non-defaulting party to terminate after written notice.",
        ),
        (
            "8. Governing law",
            "This Agreement is governed by the laws of the Republic of Kenya. Disputes shall first be addressed through "
            "good-faith negotiation, then mediation where appropriate.",
        ),
        (
            "9. Electronic execution",
            "The parties agree that electronic acceptance and digital signatures recorded on Ustawi constitute binding execution "
            "of this Agreement.",
        ),
    ]

    for heading, text in clauses:
        story.append(Paragraph(heading, heading_style))
        story.append(Paragraph(text, body_style))

    if prop.description:
        story.append(Paragraph("Property description", heading_style))
        story.append(Paragraph(prop.description.replace("\n", "<br/>"), body_style))

    story.append(Spacer(1, 20))
    story.append(Paragraph("SIGNATURES", heading_style))

    if signed and lease.tenant_signed_at and lease.landlord_signed_at:
        sig_rows = [
            ["Landlord", _person_name(landlord), lease.landlord_signed_at.strftime("%d %b %Y %H:%M UTC")],
            ["Tenant", _person_name(tenant), lease.tenant_signed_at.strftime("%d %b %Y %H:%M UTC")],
        ]
        story.append(
            Paragraph(
                "Both parties electronically signed this Agreement on the Ustawi platform.",
                body_style,
            )
        )
    else:
        sig_rows = [
            ["Landlord", _person_name(landlord), "_________________________"],
            ["Tenant", _person_name(tenant), "_________________________"],
        ]
        story.append(
            Paragraph(
                "By signing on Ustawi, each party confirms they have read and accept the terms above.",
                body_style,
            )
        )

    sig_table = Table(sig_rows, colWidths=[3 * cm, 6 * cm, 7.5 * cm])
    sig_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E8EAF2")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F7F8FC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(sig_table)
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "This document was auto-generated by Ustawi PropTech when the rental application was approved.",
            small_style,
        )
    )

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    suffix = "signed" if signed else "agreement"
    filename = f"lease-{lease.id}-{suffix}.pdf"
    return ContentFile(pdf_bytes, name=filename)


def ensure_lease_agreement_document(lease: Lease, actor=None) -> None:
    """Create or replace the lease agreement PDF if missing or not a valid PDF."""
    from apps.leases.models import LeaseDocument, LeaseDocumentType

    agreement = lease.documents.filter(doc_type=LeaseDocumentType.LEASE_AGREEMENT).first()
    pdf = generate_lease_agreement_pdf(lease, signed=False)

    if agreement is None:
        LeaseDocument.objects.create(
            lease=lease,
            doc_type=LeaseDocumentType.LEASE_AGREEMENT,
            title=f"Lease Agreement — {lease.property.title}",
            file=pdf,
            uploaded_by=actor or lease.landlord,
        )
        return

    if not _is_valid_pdf_file(agreement.file):
        try:
            agreement.file.save(pdf.name, pdf, save=True)
        except Exception:
            # Render/ephemeral storage may reject writes; download endpoint regenerates on the fly.
            pass


def ensure_signed_lease_pdf(lease: Lease) -> None:
    """Regenerate signed PDF if both parties signed but file is missing or invalid."""
    if not (lease.tenant_signed_at and lease.landlord_signed_at):
        return
    if lease.signed_pdf and _is_valid_pdf_file(lease.signed_pdf):
        return
    try:
        regenerate_signed_lease_pdf(lease)
    except Exception:
        # Detail/download views must not 500 if Cloudinary/storage write fails;
        # download endpoints can still stream a freshly generated PDF.
        logger.exception("Failed to persist signed lease PDF for lease %s", lease.pk)


def regenerate_signed_lease_pdf(lease: Lease) -> None:
    """After both parties sign, store a signed PDF copy on the lease record."""
    from apps.leases.models import LeaseDocument, LeaseDocumentType

    if not (lease.tenant_signed_at and lease.landlord_signed_at):
        return

    pdf = generate_lease_agreement_pdf(lease, signed=True)
    # ContentFile is consumed by storage.save; seek before each upload.
    lease.signed_pdf.save(pdf.name, pdf, save=True)

    signed_doc, _created = LeaseDocument.objects.get_or_create(
        lease=lease,
        doc_type=LeaseDocumentType.SIGNED_COPY,
        defaults={
            "title": f"Signed Lease — {lease.property.title}",
            "uploaded_by": lease.landlord,
        },
    )
    pdf.seek(0)
    signed_doc.file.save(pdf.name, pdf, save=True)
