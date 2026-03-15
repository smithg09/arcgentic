"""
PDF text extraction using PyMuPDF.
"""

from __future__ import annotations

import fitz  # PyMuPDF

from agent.state import Source


def extract_from_pdf(file_bytes: bytes, filename: str) -> Source:
    """
    Extract all text from a PDF file.

    Args:
        file_bytes: Raw PDF file bytes.
        filename: Original filename of the uploaded PDF.

    Returns:
        A Source object with type='pdf', extracted text, and the filename.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()

    content = "\n".join(text_parts).strip()
    return Source(
        type="pdf",
        name=filename,
        url=None,
        content=content,
    )
