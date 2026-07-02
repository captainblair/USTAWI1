from django.http import FileResponse, Http404


def serve_lease_pdf(field_file, filename: str, *, inline: bool = True) -> FileResponse:
    if not field_file:
        raise Http404("Document not found.")

    try:
        file_handle = field_file.open("rb")
    except FileNotFoundError as exc:
        raise Http404("Document file is unavailable.") from exc

    disposition = "inline" if inline else "attachment"
    response = FileResponse(file_handle, content_type="application/pdf")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    return response
