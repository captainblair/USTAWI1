import re

from django.http import FileResponse, Http404, HttpResponse

from apps.leases.models import Lease, LeaseDocument, LeaseDocumentType


def safe_pdf_filename(doc: LeaseDocument | None, fallback: str = "lease-document.pdf") -> str:
    raw = (doc.title if doc else None) or (doc.doc_type if doc else None) or fallback
    cleaned = re.sub(r"[^\w\s-]", "", raw).strip().replace(" ", "-").lower()
    if not cleaned:
        cleaned = "lease-document"
    if not cleaned.endswith(".pdf"):
        cleaned = f"{cleaned}.pdf"
    return cleaned[:120]


def pdf_bytes_response(content: bytes, filename: str, *, inline: bool = True) -> HttpResponse:
    disposition = "inline" if inline else "attachment"
    response = HttpResponse(content, content_type="application/pdf")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    response["Cache-Control"] = "private, no-store"
    return response


def serve_lease_pdf(field_file, filename: str, *, inline: bool = True) -> FileResponse:
    if not field_file:
        raise Http404("Document not found.")

    try:
        file_handle = field_file.open("rb")
    except (FileNotFoundError, OSError) as exc:
        raise Http404("Document file is unavailable.") from exc

    disposition = "inline" if inline else "attachment"
    response = FileResponse(file_handle, content_type="application/pdf")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    response["Cache-Control"] = "private, no-store"
    return response


def build_lease_document_response(lease: Lease, doc: LeaseDocument, *, actor=None) -> HttpResponse | FileResponse:
    """
    Return a PDF response for a lease document.
    Generated agreements are built on-the-fly so downloads work even when stored media is missing.
    """
    from apps.leases.services.pdf import (
        _is_valid_pdf_file,
        ensure_lease_agreement_document,
        ensure_signed_lease_pdf,
        generate_lease_agreement_pdf,
    )

    filename = safe_pdf_filename(doc)

    if doc.doc_type == LeaseDocumentType.LEASE_AGREEMENT:
        try:
            ensure_lease_agreement_document(lease, actor=actor)
            doc.refresh_from_db()
            if _is_valid_pdf_file(doc.file):
                try:
                    return serve_lease_pdf(doc.file, filename, inline=True)
                except Http404:
                    pass
        except Exception:
            pass
        pdf = generate_lease_agreement_pdf(lease, signed=False)
        return pdf_bytes_response(pdf.read(), filename, inline=True)

    if doc.doc_type == LeaseDocumentType.SIGNED_COPY:
        ensure_signed_lease_pdf(lease)
        lease.refresh_from_db()
        if _is_valid_pdf_file(lease.signed_pdf):
            try:
                return serve_lease_pdf(lease.signed_pdf, filename, inline=True)
            except Http404:
                pass
        if lease.tenant_signed_at and lease.landlord_signed_at:
            pdf = generate_lease_agreement_pdf(lease, signed=True)
            return pdf_bytes_response(pdf.read(), filename, inline=True)
        pdf = generate_lease_agreement_pdf(lease, signed=False)
        return pdf_bytes_response(pdf.read(), safe_pdf_filename(doc, "lease-agreement.pdf"), inline=True)

    if _is_valid_pdf_file(doc.file):
        try:
            return serve_lease_pdf(doc.file, filename, inline=True)
        except Http404:
            pass

    raise Http404("Document file is unavailable.")


def build_signed_lease_pdf_response(lease: Lease) -> HttpResponse | FileResponse:
    from apps.leases.services.pdf import (
        _is_valid_pdf_file,
        ensure_signed_lease_pdf,
        generate_lease_agreement_pdf,
    )

    filename = f"lease-{lease.id}-signed.pdf"
    ensure_signed_lease_pdf(lease)
    lease.refresh_from_db()

    if _is_valid_pdf_file(lease.signed_pdf):
        try:
            return serve_lease_pdf(lease.signed_pdf, filename, inline=True)
        except Http404:
            pass

    if lease.tenant_signed_at and lease.landlord_signed_at:
        pdf = generate_lease_agreement_pdf(lease, signed=True)
        return pdf_bytes_response(pdf.read(), filename, inline=True)

    raise Http404("Signed lease PDF is not available yet.")
