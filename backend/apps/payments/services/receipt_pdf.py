"""Generate downloadable payment receipt PDFs."""

from __future__ import annotations

import io

from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.payments.models import Payment


def _is_valid_pdf_file(file_field) -> bool:
    if not file_field:
        return False
    try:
        with file_field.open("rb") as fh:
            return fh.read(5) == b"%PDF-"
    except OSError:
        return False


def _person_name(user) -> str:
    profile = getattr(user, "profile", None)
    if profile and profile.full_name:
        return profile.full_name
    return user.email


def generate_payment_receipt_pdf(payment: Payment, *, receipt_number: str | None = None) -> ContentFile:
    payment = (
        Payment.objects.select_related(
            "tenant",
            "tenant__profile",
            "landlord",
            "landlord__profile",
            "invoice",
            "invoice__lease",
            "invoice__lease__property",
            "receipt",
        )
        .get(pk=payment.pk)
    )
    invoice = payment.invoice
    prop = invoice.lease.property
    receipt_no = receipt_number or (payment.receipt.receipt_number if hasattr(payment, "receipt") else invoice.invoice_number)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Receipt — {invoice.invoice_number}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReceiptTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#1F2B6C"),
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "ReceiptSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748B"),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748B"))
    value_style = ParagraphStyle("Value", parent=styles["Normal"], fontSize=11, textColor=colors.HexColor("#1F2B6C"))

    paid_at = payment.completed_at.strftime("%d %B %Y, %H:%M") if payment.completed_at else "—"
    amount_str = f"{payment.currency} {float(payment.amount):,.2f}"

    story = [
        Paragraph("USTAWI", title_style),
        Paragraph("Official Rent Payment Receipt", subtitle_style),
        Spacer(1, 0.3 * cm),
    ]

    rows = [
        ["Receipt number", receipt_no],
        ["Invoice", invoice.invoice_number],
        ["Property", prop.title],
        ["Tenant", _person_name(payment.tenant)],
        ["Landlord", _person_name(payment.landlord)],
        ["Amount paid", amount_str],
        ["Payment method", payment.get_payment_method_display()],
        ["M-Pesa phone", payment.phone_number or "—"],
        ["M-Pesa reference", payment.mpesa_receipt_number or "—"],
        ["Paid on", paid_at],
        [
            "Billing period",
            f"{invoice.billing_period_start:%d %b %Y} – {invoice.billing_period_end:%d %b %Y}",
        ],
    ]

    table = Table(rows, colWidths=[5.5 * cm, 11 * cm])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748B")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#1F2B6C")),
                ("FONTNAME", (1, 3), (1, 3), "Helvetica-Bold"),
                ("FONTNAME", (1, 5), (1, 5), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#E8EAF2")),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 1 * cm))
    story.append(
        Paragraph(
            "Thank you for paying rent through Ustawi. Keep this receipt for your records.",
            ParagraphStyle(
                "Footer",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.HexColor("#94A3B8"),
                alignment=TA_CENTER,
            ),
        )
    )

    doc.build(story)
    buffer.seek(0)
    return ContentFile(buffer.read(), name=f"{receipt_no}.pdf")


def ensure_receipt_pdf_file(receipt) -> None:
    """Replace legacy .txt receipts or missing files with a proper PDF."""
    from apps.payments.models import PaymentReceipt

    if isinstance(receipt, PaymentReceipt):
        payment = receipt.payment
        receipt_number = receipt.receipt_number
    else:
        raise TypeError("Expected PaymentReceipt instance")

    if receipt.receipt_file and _is_valid_pdf_file(receipt.receipt_file):
        return

    pdf = generate_payment_receipt_pdf(payment)
    receipt.receipt_file.save(f"{receipt_number}.pdf", pdf, save=True)
