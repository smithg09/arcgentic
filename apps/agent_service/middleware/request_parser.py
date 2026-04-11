"""
Unified request parsing for multipart and JSON payloads.

Consolidates the duplicated parsing logic that existed across chat
and sources endpoints.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from flask import Request


@dataclass
class ParsedChatRequest:
    """Parsed result of a chat-style request."""

    message: str = ""
    urls: list[str] = field(default_factory=list)
    files: list[tuple[str, bytes]] = field(default_factory=list)
    model_config_raw: dict | None = None


@dataclass
class ParsedSourcesRequest:
    """Parsed result of a sources-upload request."""

    urls: list[str] = field(default_factory=list)
    files: list[tuple[str, bytes]] = field(default_factory=list)


def parse_chat_request(request: Request) -> ParsedChatRequest:
    """Parse a chat request from either multipart form-data or JSON."""
    result = ParsedChatRequest()

    if request.content_type and "multipart/form-data" in request.content_type:
        result.message = request.form.get("message", "")

        urls_str = request.form.get("urls", "")
        result.urls = (
            [u.strip() for u in urls_str.split(",") if u.strip()]
            if urls_str
            else []
        )

        for f in request.files.getlist("files"):
            result.files.append((f.filename, f.read()))

        mc_str = request.form.get("model_config", "")
        if mc_str:
            try:
                result.model_config_raw = json.loads(mc_str)
            except json.JSONDecodeError:
                pass
    else:
        data = request.get_json(silent=True) or {}
        result.message = data.get("message", "")
        result.urls = data.get("urls", [])
        result.model_config_raw = data.get("model_config")

    return result


def parse_sources_request(request: Request) -> ParsedSourcesRequest:
    """Parse a sources-upload request from either multipart form-data or JSON."""
    result = ParsedSourcesRequest()

    if request.content_type and "multipart/form-data" in request.content_type:
        urls_str = request.form.get("urls", "")
        result.urls = (
            [u.strip() for u in urls_str.split(",") if u.strip()]
            if urls_str
            else []
        )
        for f in request.files.getlist("files"):
            if f.filename:
                result.files.append((f.filename, f.read()))
    else:
        data = request.get_json(silent=True) or {}
        result.urls = data.get("urls", [])

    return result
