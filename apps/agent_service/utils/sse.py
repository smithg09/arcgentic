"""
SSE (Server-Sent Events) streaming utilities.

Handles event formatting, the async-to-sync bridge, and tool output
serialisation for the chat endpoint.
"""

from __future__ import annotations

import asyncio
import json
import logging

from flask import stream_with_context

logger = logging.getLogger("arcgentic.sse")


def format_sse(data: dict) -> str:
    """Wrap a dict as a single SSE `data:` frame."""
    return f"data: {json.dumps(data)}\n\n"


def format_sse_end() -> str:
    """Return an SSE end-of-stream sentinel."""
    return "event: end\ndata: {}\n\n"


def handle_chat_model_stream(event: dict) -> str | None:
    """
    Extract streamable token text from an ``on_chat_model_stream`` event.

    Returns a formatted SSE string, or *None* if the event should be
    skipped (e.g. supervisor tokens, empty content).
    """
    if event.get("metadata", {}).get("langgraph_node") == "supervisor":
        return None

    content = event["data"]["chunk"].content
    if not content:
        return None

    if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
        text = content[0].get("text", "")
        if text:
            return format_sse({"type": "token", "content": text})
    elif isinstance(content, str):
        return format_sse({"type": "token", "content": content})

    return None


def handle_tool_end(event: dict) -> str:
    """Serialise and format an ``on_tool_end`` SSE event."""
    output = event.get("data", {}).get("output")
    output_str = ""

    if type(output).__name__ == "Command":
        update_data = getattr(output, "update", {})

        if (
            isinstance(update_data, dict)
            and "content" in update_data
            and isinstance(update_data["content"], dict)
        ):
            files = list(update_data["content"].keys())
            if files:
                output_str = f"Updated files: {', '.join(files)}"

        if not output_str:
            try:
                output_str = json.dumps(update_data)
            except Exception:
                output_str = str(update_data)
    else:
        output_str = str(output.content) if hasattr(output, "content") else str(output)

    tool_end_data = {
        "type": "tool_end",
        "tool": event["name"],
        "output": output_str,
    }

    tool_input = event.get("data", {}).get("input")
    if tool_input:
        tool_end_data["input"] = tool_input

    return format_sse(tool_end_data)


def create_sync_stream(async_gen):
    """
    Bridge an async generator into a synchronous one suitable for
    Flask's ``Response(stream_with_context(...))``.

    Creates a dedicated event loop per stream to avoid lock contention.
    """

    @stream_with_context
    def _sync():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            gen = async_gen()
            while True:
                try:
                    chunk = loop.run_until_complete(gen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
        finally:
            loop.close()

    return _sync
