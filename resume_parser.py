import io
import os

PDF_ERROR_IMAGE = "PDF_ERROR_IMAGE"
PDF_ERROR_PASSWORD = "PDF_ERROR_PASSWORD"
PDF_ERROR_PARSE = "PDF_ERROR_PARSE"
PDF_ERROR_TYPE = "PDF_ERROR_TYPE"
PDF_ERROR_SIZE = "PDF_ERROR_SIZE"

MAX_RESUME_MB = 10
MIN_TEXT_LENGTH = 40


class ResumeParseError(Exception):
    """Raised when a resume cannot be parsed. Carries a stable error code."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def parse_resume_file(file_storage):
    """Extract text from an uploaded resume PDF.

    Returns (text, page_count) on success. Raises ResumeParseError with a
    PDF_ERROR_* code on failure so the API can surface friendly messages.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ResumeParseError(
            PDF_ERROR_PARSE,
            "Resume parsing is not available on this server (missing pypdf).",
        )

    if not file_storage or not getattr(file_storage, "filename", None):
        raise ResumeParseError(PDF_ERROR_TYPE, "No file was uploaded.")

    if not file_storage.filename.lower().endswith(".pdf"):
        raise ResumeParseError(
            PDF_ERROR_TYPE,
            f"Only PDF files are supported, got: {file_storage.filename}",
        )

    data = file_storage.read()
    if not data:
        raise ResumeParseError(PDF_ERROR_PARSE, "The uploaded file is empty.")
    if len(data) > MAX_RESUME_MB * 1024 * 1024:
        raise ResumeParseError(
            PDF_ERROR_SIZE,
            f"File exceeds the {MAX_RESUME_MB} MB limit.",
        )

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise ResumeParseError(
                    PDF_ERROR_PASSWORD,
                    "This PDF is password-protected.",
                )
            if reader.is_encrypted:
                raise ResumeParseError(
                    PDF_ERROR_PASSWORD,
                    "This PDF is password-protected.",
                )
        pages = [page.extract_text() or "" for page in reader.pages]
    except ResumeParseError:
        raise
    except Exception:
        raise ResumeParseError(PDF_ERROR_PARSE, "Could not read this PDF.")

    text = "\n".join(pages).strip()
    if len(text) < MIN_TEXT_LENGTH:
        raise ResumeParseError(
            PDF_ERROR_IMAGE,
            "This PDF looks image-based (scanned). No extractable text was found.",
        )

    return text, len(reader.pages)
