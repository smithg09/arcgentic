"""
Input parsing utilities.

Handles PDF uploads and URL extraction, returning structured Source objects.
"""

from __future__ import annotations

from typing import BinaryIO

from agent.state import Source
from agent.parsers.pdf_parser import extract_from_pdf
from agent.parsers.url_parser import extract_from_url


def parse_user_input(
    files: list[tuple[str, bytes]] | None = None,
    urls: list[str] | None = None,
) -> list[Source]:
    """
    Parse all user-provided sources (PDFs and URLs) into Source objects.

    Args:
        files: List of (filename, file_bytes) tuples for uploaded PDFs.
        urls: List of URL strings to extract content from.

    Returns:
        List of Source objects, one per PDF/link.
    """
    sources: list[Source] = []

    # Process uploaded files
    if files:
        for filename, file_bytes in files:
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            try:
                if ext == 'pdf':
                    source = extract_from_pdf(file_bytes, filename)
                    sources.append(source)
                else:
                    # Attempt to parse as plain text (md, txt, json, yaml, etc.)
                    try:
                        text_content = file_bytes.decode('utf-8')
                        sources.append(Source(
                            type="text",
                            name=filename,
                            url=None,
                            content=text_content,
                        ))
                    except UnicodeDecodeError:
                        print(f"Warning: Unsupported binary file format '{filename}' (ext: '{ext}'). Skipping.")
            except Exception as e:
                print(f"Warning: Error extracting {filename}: {str(e)}. Skipping.")

    # Process URLs
    if urls:
        for url in urls:
            url = url.strip()
            if not url:
                continue
            try:
                source = extract_from_url(url)
                sources.append(source)
            except Exception as e:
                print(f"Warning: Error fetching URL {url}: {str(e)}. Skipping.")

    return sources


__all__ = ["parse_user_input", "extract_from_pdf", "extract_from_url"]
