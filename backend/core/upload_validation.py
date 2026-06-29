from io import BytesIO
from typing import Iterable

from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def _extension(name: str) -> str:
    if "." not in name:
        return ""
    return name.rsplit(".", 1)[-1].lower()


def validate_image_upload(
    file,
    *,
    max_size_bytes: int = MAX_IMAGE_SIZE_BYTES,
    allowed_extensions: Iterable[str] = ALLOWED_IMAGE_EXTENSIONS,
) -> None:
    if file.size > max_size_bytes:
        raise ValidationError(f"Image must be {max_size_bytes // (1024 * 1024)} MB or smaller.")

    ext = f".{_extension(file.name)}"
    if ext not in allowed_extensions:
        raise ValidationError("Unsupported image format. Use JPG, PNG, WEBP, or GIF.")

    header = file.read()
    file.seek(0)
    try:
        with Image.open(BytesIO(header)) as img:
            img.verify()
            if img.format not in ALLOWED_IMAGE_FORMATS:
                raise ValidationError("Unsupported image format.")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("File content does not match a valid image format.") from exc


def validate_document_upload(
    file,
    *,
    max_size_bytes: int = MAX_DOCUMENT_SIZE_BYTES,
    allowed_extensions: Iterable[str] = ALLOWED_DOCUMENT_EXTENSIONS,
) -> None:
    if file.size > max_size_bytes:
        raise ValidationError(f"Document must be {max_size_bytes // (1024 * 1024)} MB or smaller.")

    ext = f".{_extension(file.name)}"
    if ext not in allowed_extensions:
        raise ValidationError("Unsupported document format. Use PDF or image files.")

    header = file.read(8)
    file.seek(0)
    if ext == ".pdf" and not header.startswith(b"%PDF"):
        raise ValidationError("Invalid PDF file.")
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        validate_image_upload(file, max_size_bytes=max_size_bytes, allowed_extensions=allowed_extensions)
