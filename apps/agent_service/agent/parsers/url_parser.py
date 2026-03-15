"""
URL text extraction using trafilatura.
"""

from __future__ import annotations

import trafilatura

from agent.state import Source


def extract_from_url(url: str) -> Source:
    """
    Fetch and extract main text content from a URL.

    Uses trafilatura to download the page and extract the main
    body text, stripping navigation, ads, and boilerplate.

    Args:
        url: The URL to fetch and extract content from.

    Returns:
        A Source object with type='link', extracted text, and the URL.
    """
    downloaded = trafilatura.fetch_url(url)
    if downloaded is None:
        return Source(
            type="link",
            name=url,
            url=url,
            content=f"[Failed to fetch content from {url}]",
        )

    content = trafilatura.extract(downloaded) or ""
    # Try to extract page title from the metadata
    metadata = trafilatura.extract_metadata(downloaded)
    name = metadata.title if metadata and metadata.title else url

    return Source(
        type="link",
        name=name,
        url=url,
        content=content,
    )
