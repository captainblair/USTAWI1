"""Deliver payment receipt PDFs via authenticated download."""

from django.http import FileResponse, Http404, HttpResponse

from apps.payments.models import PaymentReceipt


def pdf_bytes_response(content: bytes, filename: str, *, inline: bool = False) -> HttpResponse:
    disposition = "inline" if inline else "attachment"
    response = HttpResponse(content, content_type="application/pdf")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    response["Cache-Control"] = "private, no-store"
    return response


def serve_receipt_pdf(field_file, filename: str) -> FileResponse:
    if not field_file:
        raise Http404("Receipt not found.")

    try:
        file_handle = field_file.open("rb")
    except (FileNotFoundError, OSError) as exc:
        raise Http404("Receipt file is unavailable.") from exc

    response = FileResponse(file_handle, content_type="application/pdf", as_attachment=True, filename=filename)
    response["Cache-Control"] = "private, no-store"
    return response


def build_receipt_download_response(receipt: PaymentReceipt) -> HttpResponse | FileResponse:
    """
    Return a PDF for a payment receipt.
    Generates on-the-fly when stored media is missing (e.g. Render ephemeral disk).
    """
    from apps.payments.services.receipt_pdf import (
        _is_valid_pdf_file,
        ensure_receipt_pdf_file,
        generate_payment_receipt_pdf,
    )

    filename = f"{receipt.receipt_number}.pdf"

    try:
        ensure_receipt_pdf_file(receipt)
        receipt.refresh_from_db()
        if _is_valid_pdf_file(receipt.receipt_file):
            try:
                return serve_receipt_pdf(receipt.receipt_file, filename)
            except Http404:
                pass
    except Exception:
        pass

    payment = (
        receipt.payment.__class__.objects.select_related(
            "tenant",
            "tenant__profile",
            "landlord",
            "landlord__profile",
            "invoice",
            "invoice__lease",
            "invoice__lease__property",
            "receipt",
        )
        .get(pk=receipt.payment_id)
    )
    pdf = generate_payment_receipt_pdf(payment, receipt_number=receipt.receipt_number)
    return pdf_bytes_response(pdf.read(), filename, inline=False)
